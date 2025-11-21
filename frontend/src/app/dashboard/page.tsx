import {
  WelcomeSection,
  CareerProgress,
  QuickActions,
  CareerGoal,
  WeeklyReport,
  AIRecommendations,
} from "@/components/dashboard"

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Welcome + Career Progress */}
      <div className="space-y-6">
        <WelcomeSection userName="Nikname" />
        <CareerProgress />
      </div>

      {/* Quick Actions + Career Goal */}
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <QuickActions />
        </div>
        <div>
          <CareerGoal />
        </div>
      </div>

      {/* Weekly Report */}
      <WeeklyReport />

      {/* AI Recommendations */}
      <AIRecommendations />
    </div>
  )
}
