"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Button } from "@/shared/ui/button"
import { Badge } from "@/shared/ui/badge"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Calendar, Clock, MapPin, Video, Building2, Plus, X, Check } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/shared/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"

interface Interview {
  id: string
  company: string
  position: string
  date: string
  time: string
  type: "online" | "office"
  location: string
  status: "upcoming" | "completed" | "cancelled"
  notes?: string
}

const initialInterviews: Interview[] = [
  {
    id: "1",
    company: "Yandex",
    position: "Senior Data Analyst",
    date: "2025-01-15",
    time: "14:00",
    type: "online",
    location: "Zoom",
    status: "upcoming",
    notes: "Техническое интервью",
  },
  {
    id: "2",
    company: "Sber",
    position: "Data Analyst",
    date: "2025-01-18",
    time: "11:00",
    type: "office",
    location: "Москва, ул. Вавилова, 19",
    status: "upcoming",
    notes: "HR-собеседование",
  },
  {
    id: "3",
    company: "VK",
    position: "Product Analyst",
    date: "2025-01-10",
    time: "16:00",
    type: "online",
    location: "Google Meet",
    status: "completed",
  },
]

export function InterviewTracker() {
  const [interviews, setInterviews] = useState<Interview[]>(initialInterviews)
  const [modalOpen, setModalOpen] = useState(false)
  const [newInterview, setNewInterview] = useState<Partial<Interview>>({
    type: "online",
    status: "upcoming",
  })

  const addInterview = () => {
    if (newInterview.company && newInterview.position && newInterview.date && newInterview.time) {
      setInterviews([
        ...interviews,
        {
          ...newInterview,
          id: Date.now().toString(),
          type: newInterview.type || "online",
          status: "upcoming",
          location: newInterview.location || "",
        } as Interview,
      ])
      setModalOpen(false)
      setNewInterview({ type: "online", status: "upcoming" })
    }
  }

  const updateStatus = (id: string, status: Interview["status"]) => {
    setInterviews(interviews.map((i) => (i.id === id ? { ...i, status } : i)))
  }

  const upcomingInterviews = interviews.filter((i) => i.status === "upcoming")
  const pastInterviews = interviews.filter((i) => i.status !== "upcoming")

  const getStatusBadge = (status: Interview["status"]) => {
    switch (status) {
      case "upcoming":
        return <Badge className="bg-blue-100 text-blue-700">Предстоит</Badge>
      case "completed":
        return <Badge className="bg-green-100 text-green-700">Завершено</Badge>
      case "cancelled":
        return <Badge className="bg-red-100 text-red-700">Отменено</Badge>
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })
  }

  return (
    <>
      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg font-semibold text-card-foreground">Трекер собеседований</CardTitle>
          <Button size="sm" onClick={() => setModalOpen(true)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-1" /> Добавить
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {upcomingInterviews.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <Calendar className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p>Нет запланированных собеседований</p>
            </div>
          ) : (
            upcomingInterviews.map((interview) => (
              <div
                key={interview.id}
                className="flex items-start gap-4 p-4 rounded-lg border border-border bg-background"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10 shrink-0">
                  <Building2 className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-semibold text-card-foreground">{interview.company}</h4>
                      <p className="text-sm text-muted-foreground">{interview.position}</p>
                    </div>
                    {getStatusBadge(interview.status)}
                  </div>
                  <div className="flex flex-wrap gap-3 mt-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatDate(interview.date)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {interview.time}
                    </span>
                    <span className="flex items-center gap-1">
                      {interview.type === "online" ? (
                        <Video className="h-3.5 w-3.5" />
                      ) : (
                        <MapPin className="h-3.5 w-3.5" />
                      )}
                      {interview.location}
                    </span>
                  </div>
                  {interview.notes && <p className="text-sm text-muted-foreground mt-2 italic">{interview.notes}</p>}
                  <div className="flex gap-2 mt-3">
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-green-50 text-green-600 border-green-200 hover:bg-green-100"
                      onClick={() => updateStatus(interview.id, "completed")}
                    >
                      <Check className="h-3.5 w-3.5 mr-1" /> Завершено
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
                      onClick={() => updateStatus(interview.id, "cancelled")}
                    >
                      <X className="h-3.5 w-3.5 mr-1" /> Отменить
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}

          {pastInterviews.length > 0 && (
            <div className="pt-4 border-t border-border">
              <h4 className="text-sm font-medium text-muted-foreground mb-3">История ({pastInterviews.length})</h4>
              <div className="space-y-2">
                {pastInterviews.slice(0, 3).map((interview) => (
                  <div key={interview.id} className="flex items-center justify-between py-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-card-foreground">{interview.company}</span>
                      <span className="text-muted-foreground">• {interview.position}</span>
                    </div>
                    {getStatusBadge(interview.status)}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[500px] bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-card-foreground">Добавить собеседование</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-card-foreground">Компания</Label>
                <Input
                  value={newInterview.company || ""}
                  onChange={(e) => setNewInterview({ ...newInterview, company: e.target.value })}
                  placeholder="Yandex"
                  className="bg-background border-border"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-card-foreground">Должность</Label>
                <Input
                  value={newInterview.position || ""}
                  onChange={(e) => setNewInterview({ ...newInterview, position: e.target.value })}
                  placeholder="Data Analyst"
                  className="bg-background border-border"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-card-foreground">Дата</Label>
                <Input
                  type="date"
                  value={newInterview.date || ""}
                  onChange={(e) => setNewInterview({ ...newInterview, date: e.target.value })}
                  className="bg-background border-border"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-card-foreground">Время</Label>
                <Input
                  type="time"
                  value={newInterview.time || ""}
                  onChange={(e) => setNewInterview({ ...newInterview, time: e.target.value })}
                  className="bg-background border-border"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-card-foreground">Формат</Label>
              <Select
                value={newInterview.type}
                onValueChange={(value: "online" | "office") => setNewInterview({ ...newInterview, type: value })}
              >
                <SelectTrigger className="bg-background border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="online">Онлайн</SelectItem>
                  <SelectItem value="office">В офисе</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-card-foreground">
                {newInterview.type === "online" ? "Платформа/Ссылка" : "Адрес"}
              </Label>
              <Input
                value={newInterview.location || ""}
                onChange={(e) => setNewInterview({ ...newInterview, location: e.target.value })}
                placeholder={newInterview.type === "online" ? "Zoom, Google Meet..." : "Адрес офиса"}
                className="bg-background border-border"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-card-foreground">Заметки</Label>
              <Input
                value={newInterview.notes || ""}
                onChange={(e) => setNewInterview({ ...newInterview, notes: e.target.value })}
                placeholder="Тип собеседования, что подготовить..."
                className="bg-background border-border"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)} className="bg-transparent border-border">
              Отмена
            </Button>
            <Button onClick={addInterview} className="bg-blue-600 hover:bg-blue-700">
              Добавить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
