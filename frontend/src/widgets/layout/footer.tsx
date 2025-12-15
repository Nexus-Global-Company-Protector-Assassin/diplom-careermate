import { Zap, Briefcase } from "lucide-react"
import {
  Sparkles,
  Crown,
  BarChart3,
  Bot,
  FileText,
  BookOpen,
  Layout,
  Database,
  Users,
  Building2,
  Newspaper,
  Handshake,
  Phone,
  HelpCircle,
  MessageCircle,
  AlertCircle,
  Lightbulb,
  HeadphonesIcon,
} from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t border-border bg-slate-900 dark:bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid gap-8 md:grid-cols-5">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold">
                Career<span className="text-blue-400">Mate</span>
              </span>
            </div>
            <p className="text-sm text-slate-400 mb-6">
              Умный карьерный помощник, который поможет найти работу мечты. Используем AI для создания идеального резюме
              и подготовки к собеседованиям.
            </p>
            <div className="flex gap-3">
              {["M", "X", "in", "Y"].map((icon, i) => (
                <div
                  key={i}
                  className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800 dark:bg-slate-900 text-sm font-medium hover:bg-slate-700 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                >
                  {icon}
                </div>
              ))}
            </div>
          </div>

          {/* Продукт */}
          <div>
            <h3 className="font-semibold mb-4">Продукт</h3>
            <ul className="space-y-3 text-sm text-slate-400">
              <li className="flex items-center gap-2 hover:text-white cursor-pointer transition-colors">
                <Sparkles className="h-4 w-4" /> Возможности
              </li>
              <li className="flex items-center gap-2 hover:text-white cursor-pointer transition-colors">
                <Crown className="h-4 w-4" /> Премиум
              </li>
              <li className="flex items-center gap-2 hover:text-white cursor-pointer transition-colors">
                <BarChart3 className="h-4 w-4" /> Аналитика
              </li>
              <li className="flex items-center gap-2 hover:text-white cursor-pointer transition-colors">
                <Bot className="h-4 w-4" /> AI-помощник
              </li>
            </ul>
          </div>

          {/* Ресурсы */}
          <div>
            <h3 className="font-semibold mb-4">Ресурсы</h3>
            <ul className="space-y-3 text-sm text-slate-400">
              <li className="flex items-center gap-2 hover:text-white cursor-pointer transition-colors">
                <FileText className="h-4 w-4" /> Блог
              </li>
              <li className="flex items-center gap-2 hover:text-white cursor-pointer transition-colors">
                <BookOpen className="h-4 w-4" /> Курсы
              </li>
              <li className="flex items-center gap-2 hover:text-white cursor-pointer transition-colors">
                <Layout className="h-4 w-4" /> Шаблоны резюме
              </li>
              <li className="flex items-center gap-2 hover:text-white cursor-pointer transition-colors">
                <Database className="h-4 w-4" /> База знаний
              </li>
              <li className="flex items-center gap-2 hover:text-white cursor-pointer transition-colors">
                <Users className="h-4 w-4" /> Вебинары
              </li>
            </ul>
          </div>

          {/* Компания */}
          <div>
            <h3 className="font-semibold mb-4">Компания</h3>
            <ul className="space-y-3 text-sm text-slate-400">
              <li className="flex items-center gap-2 hover:text-white cursor-pointer transition-colors">
                <Building2 className="h-4 w-4" /> О нас
              </li>
              <li className="flex items-center gap-2 hover:text-white cursor-pointer transition-colors">
                <Briefcase className="h-4 w-4" /> Карьера
              </li>
              <li className="flex items-center gap-2 hover:text-white cursor-pointer transition-colors">
                <Newspaper className="h-4 w-4" /> Новости
              </li>
              <li className="flex items-center gap-2 hover:text-white cursor-pointer transition-colors">
                <Handshake className="h-4 w-4" /> Партнёры
              </li>
              <li className="flex items-center gap-2 hover:text-white cursor-pointer transition-colors">
                <Phone className="h-4 w-4" /> Контакты
              </li>
            </ul>
          </div>

          {/* Поддержка */}
          <div>
            <h3 className="font-semibold mb-4">Поддержка</h3>
            <ul className="space-y-3 text-sm text-slate-400">
              <li className="flex items-center gap-2 hover:text-white cursor-pointer transition-colors">
                <HelpCircle className="h-4 w-4" /> Помощь
              </li>
              <li className="flex items-center gap-2 hover:text-white cursor-pointer transition-colors">
                <MessageCircle className="h-4 w-4" /> Сообщество
              </li>
              <li className="flex items-center gap-2 hover:text-white cursor-pointer transition-colors">
                <AlertCircle className="h-4 w-4" /> Сообщить об ошибке
              </li>
              <li className="flex items-center gap-2 hover:text-white cursor-pointer transition-colors">
                <Lightbulb className="h-4 w-4" /> Предложить идею
              </li>
              <li className="flex items-center gap-2 hover:text-white cursor-pointer transition-colors">
                <HeadphonesIcon className="h-4 w-4" /> Служба поддержки
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  )
}
