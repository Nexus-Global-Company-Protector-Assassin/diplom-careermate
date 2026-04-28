import { MainLayout } from "@/widgets/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"
import { Button } from "@/shared/ui/button"
import Link from "next/link"
import { ArrowLeft, CheckCircle2, FileText, Briefcase, AlertCircle } from "lucide-react"

async function getLatestResult() {
  try {
    const res = await fetch('http://127.0.0.1:3001/api/poc/result', { 
      cache: 'no-store' 
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    return null;
  }
}

export default async function PocResultPage() {
  const resultObj = await getLatestResult();
  const data = resultObj?.content || {};
  const analysis = data.analysis || {};
  const vacanciesData = data.vacancies || {};
  const vacancies = vacanciesData.vacancies || [];
  
  const generatedResume = data.resume || {};
  const recommendations = generatedResume.recommendations || [];
  const autoFixed = generatedResume.autoFixed || [];
  const skillsGaps = analysis.skillGaps || [];
  const aiScore = analysis.score || 0;
  const level = analysis.level || 'Junior';
  return (
    <MainLayout>
      <div className="space-y-6 max-w-4xl mx-auto py-8 animate-in fade-in zoom-in-95 duration-500">
        <div className="flex items-center justify-between">
          <div>
            <Link href="/profile">
              <Button variant="ghost" size="sm" className="mb-2 -ml-3 text-muted-foreground">
                <ArrowLeft className="mr-2 h-4 w-4" /> Назад к профилю
              </Button>
            </Link>
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
              Результаты анализа
            </h1>
            <p className="text-muted-foreground mt-2">
              Нейросеть успешно проанализировала ваш профиль и подобрала лучшие варианты.
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Real Vacancies Section */}
          <Card className="bg-card border-border shadow-md">
            <CardHeader className="bg-blue-500/5 pb-4 border-b border-border/50">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Briefcase className="h-5 w-5 text-blue-500" />
                Подходящие вакансии с HH.ru
              </CardTitle>
              <CardDescription>
                Для расчёта использован AI Score: {aiScore}/100. Ваш уровень: {level}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {vacancies.length === 0 ? (
                    <div className="text-center p-4 text-muted-foreground flex flex-col items-center gap-2">
                        <AlertCircle className="w-8 h-8 opacity-50" />
                        Ваш профиль в обработке или вакансии не найдены
                    </div>
                ) : vacancies.map((vac: any, idx: number) => (
                    <div key={idx} className="rounded-lg border border-border p-4 bg-background">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-lg">{vac.title}</h3>
                        <span className="text-green-600 dark:text-green-400 font-bold bg-green-500/10 px-2 py-1 rounded text-sm">Match {vac.matchScore}%</span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">{vac.employer} • {vac.location}</p>
                      <p className="text-sm text-primary mb-3 font-semibold">{vac.salaryLabel}</p>
                      <p className="text-sm line-clamp-3">{vac.descriptionPreview}</p>
                      {vac.skills && vac.skills.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1">
                              {vac.skills.slice(0, 4).map((skill: string, sIdx: number) => (
                                  <span key={sIdx} className="text-xs bg-muted/60 px-2 py-0.5 rounded-full">{skill}</span>
                              ))}
                          </div>
                      )}
                    </div>
                ))}
                
                {vacancies.length > 0 && (
                    <Button className="w-full mt-2" variant="outline">Смотреть все совпадения</Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Adapted Resume Section Placeholder */}
          <Card className="bg-card border-border shadow-md">
            <CardHeader className="bg-purple-500/5 pb-4 border-b border-border/50">
              <CardTitle className="flex items-center gap-2 text-xl">
                <FileText className="h-5 w-5 text-purple-500" />
                Адаптированное резюме
              </CardTitle>
              <CardDescription>
                AI переработал ваше резюме, акцентировав внимание на продуктовой аналитике и A/B тестировании.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="bg-muted/30 p-4 rounded-lg font-mono text-sm max-h-[500px] overflow-y-auto border border-border/50 prose dark:prose-invert">
                {generatedResume.fullName ? (
                    <>
                        <h3 className="mt-0">{generatedResume.fullName}</h3>
                        <p><strong>Цель:</strong> {generatedResume.targetPosition}</p>
                        
                        <h4>Summary</h4>
                        <p>{generatedResume.summary}</p>

                        {generatedResume.experience && generatedResume.experience.length > 0 && (
                            <>
                                <h4>Опыт работы</h4>
                                {generatedResume.experience.map((exp: any, i: number) => (
                                    <div key={i} className="mb-4">
                                        <p className="font-semibold text-base mb-0 leading-tight">{exp.position} в {exp.company}</p>
                                        <p className="text-muted-foreground text-xs mt-1 mb-2">{exp.period}</p>
                                        <ul className="list-disc pl-5 mt-1">
                                            {exp.achievements?.map((ach: string, j: number) => (
                                                <li key={j} className="mb-1">{ach}</li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </>
                        )}
                        
                        <hr className="my-6 border-border" />
                        
                        <h4 className="flex items-center gap-2 text-green-600 dark:text-green-400">
                          <CheckCircle2 className="w-5 h-5" /> Что ИИ исправил автоматически
                        </h4>
                        <ul>
                            {autoFixed.length > 0 ? autoFixed.map((fix: string, fIdx: number) => (
                                <li key={fIdx}>{fix}</li>
                            )) : (
                                <li>Автоматических исправлений нет</li>
                            )}
                        </ul>

                        <h4 className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
                          <AlertCircle className="w-5 h-5" /> Раздел для вашей ручной проработки
                        </h4>
                        <ul>
                            {recommendations.length > 0 ? recommendations.map((rec: string, rIdx: number) => (
                                <li key={rIdx}>{rec}</li>
                            )) : (
                                <li>Нет ручных рекомендаций</li>
                            )}
                        </ul>

                        <h4>Skill Gaps (Что подкачать для этой роли)</h4>
                        <ul>
                          {skillsGaps.length > 0 ? skillsGaps.map((skill: string, sIdx: number) => (
                              <li key={sIdx}>{skill}</li>
                          )) : (
                              <li>Не обнаружено существенных гэпов</li>
                          )}
                        </ul>
                    </>
                ) : (
                    <div className="text-center p-8 text-muted-foreground">
                        <AlertCircle className="w-12 h-12 opacity-50 mx-auto mb-4" />
                        <p>ИИ обрабатывает ваш профиль. Пожалуйста, подождите или запустите анализ.</p>
                    </div>
                )}
                <p className="text-muted-foreground text-xs text-center mt-4 border-t pt-4">Это превью сгенерированного резюме. Нажмите ниже, чтобы скачать полную версию.</p>
              </div>
              <div className="flex gap-3 mt-6">
                <Button className="w-full bg-purple-600 hover:bg-purple-700">Скачать PDF</Button>
                <Button className="w-full" variant="outline">Экспорт в DOCX</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  )
}
