"use client"

import { useState } from "react"
import { Button } from "@/shared/ui/button"
import { Download, FileText, FileSpreadsheet, Loader2 } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/shared/ui/dropdown-menu"

export function ExportData() {
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async (format: "pdf" | "json" | "csv") => {
    setIsExporting(true)

    // Simulate export
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // Create mock data
    const data = {
      profile: {
        name: "Баранов Сергей",
        email: "oldersik@gmail.ru",
        phone: "+7 (900) 123-45-67",
        city: "Владивосток",
      },
      experience: [
        { position: "Middle Data Analyst", company: "Сбер", period: "2018 - 2020" },
        { position: "Senior Data Analyst", company: "Озон", period: "2020 - настоящее время" },
      ],
      skills: ["Python", "SQL", "Tableau", "Power BI", "A/B тестирование"],
      exportDate: new Date().toISOString(),
    }

    if (format === "json") {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `careermate-profile-${new Date().toISOString().split("T")[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
    } else if (format === "csv") {
      const csvContent = `Поле,Значение
ФИО,${data.profile.name}
Email,${data.profile.email}
Телефон,${data.profile.phone}
Город,${data.profile.city}
Навыки,"${data.skills.join(", ")}"
`
      const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `careermate-profile-${new Date().toISOString().split("T")[0]}.csv`
      a.click()
      URL.revokeObjectURL(url)
    }

    setIsExporting(false)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="bg-transparent border-border" disabled={isExporting}>
          {isExporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
          Экспорт данных
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport("pdf")} className="cursor-pointer">
          <FileText className="h-4 w-4 mr-2" />
          Экспорт в PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport("json")} className="cursor-pointer">
          <FileText className="h-4 w-4 mr-2" />
          Экспорт в JSON
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport("csv")} className="cursor-pointer">
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Экспорт в CSV
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
