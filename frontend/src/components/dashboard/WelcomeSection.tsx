interface WelcomeSectionProps {
  userName: string
}

export function WelcomeSection({ userName }: WelcomeSectionProps) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-100 to-blue-200">
        <span className="text-3xl">🤖</span>
      </div>
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          Привет, {userName}!
        </h1>
        <p className="text-muted-foreground">
          Вы еще на шаг ближе к работе своей мечты!
        </p>
      </div>
    </div>
  )
}
