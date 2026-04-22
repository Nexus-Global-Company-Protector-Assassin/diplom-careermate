import { Injectable, OnModuleInit } from '@nestjs/common';
import * as os from 'os';
import * as process from 'process';

interface Labels {
    [key: string]: string;
}

interface CounterEntry {
    labels: Labels;
    value: number;
}

interface HistogramEntry {
    labels: Labels;
    count: number;
    sum: number;
    buckets: Map<number, number>;
}

class PrometheusCounter {
    private readonly entries = new Map<string, CounterEntry>();
    constructor(
        private readonly name: string,
        private readonly help: string,
        private readonly bucketBounds?: number[],
    ) {}

    inc(labels: Labels, value = 1) {
        const key = this.labelKey(labels);
        const entry = this.entries.get(key) ?? { labels, value: 0 };
        entry.value += value;
        this.entries.set(key, entry);
    }

    serialize(): string {
        const lines: string[] = [
            `# HELP ${this.name} ${this.help}`,
            `# TYPE ${this.name} counter`,
        ];
        for (const { labels, value } of this.entries.values()) {
            lines.push(`${this.name}${this.formatLabels(labels)} ${value}`);
        }
        return lines.join('\n');
    }

    private labelKey(labels: Labels) {
        return Object.entries(labels).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${k}="${v}"`).join(',');
    }

    private formatLabels(labels: Labels) {
        const parts = Object.entries(labels).map(([k, v]) => `${k}="${v}"`);
        return parts.length ? `{${parts.join(',')}}` : '';
    }
}

class PrometheusHistogram {
    private readonly BOUNDS = [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2, 5];
    private readonly entries = new Map<string, HistogramEntry>();

    constructor(
        private readonly name: string,
        private readonly help: string,
        bounds?: number[],
    ) {
        if (bounds) this.BOUNDS = bounds;
    }

    observe(labels: Labels, value: number) {
        const key = this.labelKey(labels);
        if (!this.entries.has(key)) {
            const buckets = new Map<number, number>();
            for (const b of this.BOUNDS) buckets.set(b, 0);
            this.entries.set(key, { labels, count: 0, sum: 0, buckets });
        }
        const entry = this.entries.get(key)!;
        entry.count++;
        entry.sum += value;
        for (const b of this.BOUNDS) {
            if (value <= b) entry.buckets.set(b, (entry.buckets.get(b) ?? 0) + 1);
        }
    }

    serialize(): string {
        const lines: string[] = [
            `# HELP ${this.name} ${this.help}`,
            `# TYPE ${this.name} histogram`,
        ];
        for (const { labels, count, sum, buckets } of this.entries.values()) {
            const lb = this.formatLabels(labels);
            const lbInner = lb ? lb.slice(0, -1) : '{';
            let cumulative = 0;
            for (const [b, cnt] of buckets) {
                cumulative += cnt;
                const leLabel = `${lbInner === '{' ? '{' : lbInner + ','}le="${b}"}`;
                lines.push(`${this.name}_bucket${leLabel} ${cumulative}`);
            }
            const infLabel = `${lbInner === '{' ? '{' : lbInner + ','}le="+Inf"}`;
            lines.push(`${this.name}_bucket${infLabel} ${count}`);
            lines.push(`${this.name}_sum${lb} ${sum}`);
            lines.push(`${this.name}_count${lb} ${count}`);
        }
        return lines.join('\n');
    }

    private labelKey(labels: Labels) {
        return Object.entries(labels).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${k}="${v}"`).join(',');
    }

    private formatLabels(labels: Labels) {
        const parts = Object.entries(labels).map(([k, v]) => `${k}="${v}"`);
        return parts.length ? `{${parts.join(',')}}` : '';
    }
}

@Injectable()
export class MetricsService implements OnModuleInit {
    readonly httpRequestsTotal = new PrometheusCounter(
        'http_requests_total',
        'Total number of HTTP requests',
    );

    readonly httpRequestDuration = new PrometheusHistogram(
        'http_request_duration_seconds',
        'HTTP request duration in seconds',
        [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2, 5],
    );

    private startTime = Date.now();

    onModuleInit() {
        this.startTime = Date.now();
    }

    async getMetrics(): Promise<string> {
        const uptimeSeconds = process.uptime();
        const mem = process.memoryUsage();
        const totalMem = os.totalmem();
        const freeMem = os.freemem();

        const nodeMetrics = [
            `# HELP nodejs_process_uptime_seconds Process uptime in seconds`,
            `# TYPE nodejs_process_uptime_seconds gauge`,
            `nodejs_process_uptime_seconds ${uptimeSeconds.toFixed(2)}`,
            `# HELP nodejs_heap_size_used_bytes Process heap size used`,
            `# TYPE nodejs_heap_size_used_bytes gauge`,
            `nodejs_heap_size_used_bytes ${mem.heapUsed}`,
            `# HELP nodejs_heap_size_total_bytes Process heap size total`,
            `# TYPE nodejs_heap_size_total_bytes gauge`,
            `nodejs_heap_size_total_bytes ${mem.heapTotal}`,
            `# HELP nodejs_external_memory_bytes External memory`,
            `# TYPE nodejs_external_memory_bytes gauge`,
            `nodejs_external_memory_bytes ${mem.external}`,
            `# HELP process_resident_memory_bytes Resident memory size`,
            `# TYPE process_resident_memory_bytes gauge`,
            `process_resident_memory_bytes ${mem.rss}`,
            `# HELP os_memory_total_bytes Total system memory`,
            `# TYPE os_memory_total_bytes gauge`,
            `os_memory_total_bytes ${totalMem}`,
            `# HELP os_memory_free_bytes Free system memory`,
            `# TYPE os_memory_free_bytes gauge`,
            `os_memory_free_bytes ${freeMem}`,
        ].join('\n');

        return [
            this.httpRequestsTotal.serialize(),
            this.httpRequestDuration.serialize(),
            nodeMetrics,
        ].join('\n\n') + '\n';
    }

    contentType(): string {
        return 'text/plain; version=0.0.4; charset=utf-8';
    }
}
