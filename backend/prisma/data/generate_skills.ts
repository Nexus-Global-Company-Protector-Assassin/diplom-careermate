import * as fs from 'fs';
import * as path from 'path';

interface Skill {
    name: string;
    category: string;
    aliases: string[];
}

const skills: Skill[] = [];

// Helper to add
const add = (category: string, list: string | string[], aliases: string[] = []) => {
    if (typeof list === 'string') {
        skills.push({ name: list, category, aliases: aliases.map(a => a.toLowerCase()) });
    } else {
        list.forEach(name => {
            skills.push({ name, category, aliases: [name.toLowerCase().replace(/\s+/g, '')] });
        });
    }
};

// 1. Frontend
const frontend = [
    'React', 'Angular', 'Vue.js', 'Svelte', 'Ember.js', 'Backbone.js', 'Preact', 'Solid.js', 'Alpine.js', 'Lit',
    'Next.js', 'Nuxt.js', 'Gatsby', 'Remix', 'Astro', 'Qwik',
    'HTML5', 'CSS3', 'Sass', 'SCSS', 'Less', 'Stylus', 'PostCSS', 'Tailwind CSS', 'Bootstrap', 'Material-UI', 'Chakra UI', 'Ant Design', 'Mantine', 'Styled Components', 'Emotion', 'Framer Motion', 'Three.js', 'WebGL', 'Canvas',
    'Webpack', 'Vite', 'Parcel', 'Rollup', 'Esbuild', 'Babel', 'SWC', 'Turbopack',
    'Redux', 'MobX', 'Zustand', 'Recoil', 'Jotai', 'Pinia', 'Vuex', 'RxJS', 'Apollo Client', 'URQL', 'React Query', 'SWR',
    'Jest', 'Cypress', 'Playwright', 'Puppeteer', 'Testing Library', 'Vitest', 'Enzyme',
    'Storybook', 'Lerna', 'Nx', 'Microfrontends', 'Web Components', 'PWA', 'Service Workers', 'WebSockets', 'WebRTC'
];
frontend.forEach(s => add('Frontend', s));
add('Frontend', 'React', ['react.js', 'reactjs']);
add('Frontend', 'Vue.js', ['vue', 'vuejs']);

// 2. Backend
const backend = [
    'Node.js', 'Express', 'NestJS', 'Koa', 'Fastify', 'Hapi', 'Sails.js', 'Meteor',
    'Django', 'Flask', 'FastAPI', 'Tornado', 'Pyramid', 'Bottle',
    'Spring Boot', 'Spring', 'Hibernate', 'Micronaut', 'Quarkus', 'Vert.x',
    'Ruby on Rails', 'Sinatra', 'Hanami',
    'Laravel', 'Symfony', 'CodeIgniter', 'Yii', 'Zend', 'CakePHP',
    'ASP.NET', '.NET Core', 'Entity Framework',
    'Gin', 'Echo', 'Fiber', 'Beego', 'Revel',
    'Actix', 'Rocket', 'Axum', 'Warp',
    'Phoenix', 'Elixir', 'Erlang',
    'GraphQL', 'REST API', 'gRPC', 'SOAP', 'tRPC',
    'RabbitMQ', 'Apache Kafka', 'ActiveMQ', 'ZeroMQ', 'NATS',
    'Celery', 'Sidekiq', 'Redis Pub/Sub', 'WebSockets'
];
backend.forEach(s => add('Backend', s));
add('Backend', 'Node.js', ['nodejs', 'node']);
add('Backend', '.NET', ['dotnet', 'asp.net', 'c#', 'csharp']);

// 3. Languages
const languages = [
    'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C', 'C#', 'Ruby', 'PHP', 'Go', 'Rust', 'Swift', 'Kotlin', 'Dart', 'Scala', 'Haskell', 'Clojure', 'Elixir', 'Erlang', 'F#', 'OCaml', 'R', 'Julia', 'MATLAB', 'Perl', 'Lua', 'Bash', 'Shell', 'PowerShell', 'SQL', 'NoSQL', 'WebAssembly', 'Solidity'
];
languages.forEach(s => add('Languages', s));
add('Languages', 'JavaScript', ['js', 'es6']);
add('Languages', 'TypeScript', ['ts']);

// 4. Mobile
const mobile = [
    'React Native', 'Flutter', 'SwiftUI', 'UIKit', 'Android SDK', 'Jetpack Compose', 'Kotlin Multiplatform', 'Xamarin', 'Ionic', 'Cordova', 'Capacitor', 'NativeScript', 'Objective-C', 'Java (Android)', 'CoreData', 'Realm', 'SQLite'
];
mobile.forEach(s => add('Mobile', s));

// 5. Database
const database = [
    'PostgreSQL', 'MySQL', 'MariaDB', 'SQLite', 'Oracle Database', 'Microsoft SQL Server', 'IBM DB2',
    'MongoDB', 'CouchDB', 'Cassandra', 'ScyllaDB', 'DynamoDB', 'Cosmos DB', 'Firebase Realtime Database', 'Firestore',
    'Redis', 'Memcached', 'Hazelcast', 'Varnish',
    'Elasticsearch', 'Solr', 'Meilisearch', 'Algolia', 'Typesense',
    'Neo4j', 'ArangoDB', 'OrientDB', 'JanusGraph',
    'InfluxDB', 'TimescaleDB', 'Prometheus', 'ClickHouse', 'Snowflake', 'BigQuery', 'Amazon Redshift', 'Databricks', 'Teradata',
    'Prisma', 'TypeORM', 'Sequelize', 'Mongoose', 'Drizzle ORM', 'Knex.js', 'SQLAlchemy', 'Hibernate'
];
database.forEach(s => add('Database', s));
add('Database', 'PostgreSQL', ['postgres']);

// 6. DevOps & Cloud
const devops = [
    'Docker', 'Docker Compose', 'Kubernetes', 'K3s', 'Minikube', 'Helm', 'Istio', 'Linkerd',
    'Terraform', 'Ansible', 'Chef', 'Puppet', 'Pulumi', 'CloudFormation',
    'Jenkins', 'GitLab CI', 'GitHub Actions', 'CircleCI', 'Travis CI', 'Bitbucket Pipelines', 'ArgoCD', 'Spinnaker', 'Flux',
    'Prometheus', 'Grafana', 'ELK Stack', 'Datadog', 'New Relic', 'Dynatrace', 'Splunk', 'AppDynamics', 'Sentry', 'Jaeger', 'Zipkin', 'OpenTelemetry',
    'Nginx', 'Apache HTTP Server', 'HAProxy', 'Traefik', 'Caddy', 'Envoy',
    'AWS', 'Amazon Web Services', 'Azure', 'Google Cloud Platform', 'GCP', 'DigitalOcean', 'Heroku', 'Vercel', 'Netlify', 'Cloudflare', 'Fastly',
    'Linux', 'Ubuntu', 'CentOS', 'Debian', 'Alpine Linux', 'Unix', 'Bash Scripting', 'Vagrant', 'Packer'
];
devops.forEach(s => add('DevOps', s));
add('DevOps', 'Kubernetes', ['k8s']);

// 7. Data Science & ML
const data = [
    'Machine Learning', 'Deep Learning', 'Data Science', 'Data Engineering', 'Data Analysis', 'NLP', 'Computer Vision', 'Reinforcement Learning',
    'TensorFlow', 'PyTorch', 'Keras', 'Scikit-learn', 'XGBoost', 'LightGBM', 'CatBoost', 'Fastai',
    'Pandas', 'NumPy', 'SciPy', 'Matplotlib', 'Seaborn', 'Plotly', 'Bokeh',
    'Apache Spark', 'Hadoop', 'Hive', 'Pig', 'Flink', 'Airflow', 'Luigi', 'Prefect', 'Dagster', 'dbt', 'Great Expectations',
    'Tableau', 'Power BI', 'Looker', 'Metabase', 'Superset', 'QlikView',
    'Jupyter', 'Google Colab', 'Databricks', 'MLflow', 'Kubeflow', 'Weights & Biases', 'Hugging Face'
];
data.forEach(s => add('Data', s));
add('Data', 'Scikit-learn', ['sklearn']);

// 8. Cybersecurity
const security = [
    'Penetration Testing', 'Ethical Hacking', 'Vulnerability Assessment', 'Security Auditing', 'Malware Analysis', 'Reverse Engineering', 'Cryptography', 'IAM', 'SSO', 'OAuth2', 'OpenID Connect', 'JWT', 'SAML',
    'Burp Suite', 'Metasploit', 'Nmap', 'Wireshark', 'Nessus', 'Kali Linux', 'OWASP Top 10', 'SOC 2', 'ISO 27001', 'GDPR', 'HIPAA', 'PCI DSS',
    'Firewalls', 'WAF', 'IDS', 'IPS', 'SIEM', 'Endpoint Security', 'Zero Trust', 'Cloud Security'
];
security.forEach(s => add('Security', s));

// 9. Design & Product
const design = [
    'Figma', 'Sketch', 'Adobe XD', 'Adobe Photoshop', 'Adobe Illustrator', 'Adobe After Effects', 'InVision', 'Zeplin', 'Marvel', 'Balsamiq',
    'UI Design', 'UX Design', 'Wireframing', 'Prototyping', 'User Research', 'Usability Testing', 'Interaction Design', 'Visual Design', 'Design Systems', 'Typography', 'Color Theory',
    'Product Management', 'Agile', 'Scrum', 'Kanban', 'Lean', 'SAFe', 'Jira', 'Confluence', 'Trello', 'Asana', 'Notion', 'Linear', 'Miro', 'FigJam'
];
design.forEach(s => add('Design', s));

// 10. QA & Testing
const qa = [
    'Quality Assurance', 'Manual Testing', 'Automated Testing', 'Performance Testing', 'Load Testing', 'Security Testing', 'API Testing', 'Mobile Testing', 'E2E Testing', 'Integration Testing', 'Unit Testing', 'Regression Testing',
    'Selenium', 'Appium', 'Katalon Studio', 'Postman', 'SoapUI', 'JMeter', 'Gatling', 'Locust', 'TestRail', 'Xray', 'Cucumber', 'Behave', 'SpecFlow'
];
qa.forEach(s => add('QA', s));

// 11. Soft Skills
const soft = [
    'Communication', 'Teamwork', 'Problem Solving', 'Critical Thinking', 'Leadership', 'Time Management', 'Adaptability', 'Emotional Intelligence', 'Mentoring', 'Public Speaking', 'Conflict Resolution', 'Negotiation', 'Project Management', 'Agile Methodologies', 'Self-Motivation', 'Active Listening', 'Creativity', 'Decision Making'
];
soft.forEach(s => add('Soft Skills', s));

// Clean up duplicates and write to file
const uniqueSkills = new Map<string, Skill>();

skills.forEach(skill => {
    const canonical = skill.name;
    if (!uniqueSkills.has(canonical)) {
        uniqueSkills.set(canonical, skill);
    } else {
        const existing = uniqueSkills.get(canonical)!;
        skill.aliases.forEach(a => {
            if (!existing.aliases.includes(a)) existing.aliases.push(a);
        });
    }
});

const finalArray = Array.from(uniqueSkills.values());
const outputPath = path.join(__dirname, 'skills.json');
fs.writeFileSync(outputPath, JSON.stringify(finalArray, null, 2));

console.log(`Successfully generated ${finalArray.length} skills to ${outputPath}`);
