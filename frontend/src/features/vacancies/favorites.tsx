"use client"

import { useState, createContext, useContext, type ReactNode } from "react"

interface FavoriteJob {
  id: string
  company: string
  title: string
  salary: string
  match: string
}

interface FavoritesContextType {
  favorites: FavoriteJob[]
  addFavorite: (job: FavoriteJob) => void
  removeFavorite: (id: string) => void
  isFavorite: (id: string) => boolean
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined)

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<FavoriteJob[]>([])

  const addFavorite = (job: FavoriteJob) => {
    setFavorites((prev) => [...prev, job])
  }

  const removeFavorite = (id: string) => {
    setFavorites((prev) => prev.filter((job) => job.id !== id))
  }

  const isFavorite = (id: string) => {
    return favorites.some((job) => job.id === id)
  }

  return (
    <FavoritesContext.Provider value={{ favorites, addFavorite, removeFavorite, isFavorite }}>
      {children}
    </FavoritesContext.Provider>
  )
}

export function useFavorites() {
  const context = useContext(FavoritesContext)
  if (!context) {
    throw new Error("useFavorites must be used within a FavoritesProvider")
  }
  return context
}
