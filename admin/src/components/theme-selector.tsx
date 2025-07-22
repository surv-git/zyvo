"use client"

import { useEffect, useState } from "react"
import { useThemeConfig } from "@/components/active-theme"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const themes = [
  {
    name: "Default",
    value: "default",
    color: "bg-slate-600",
  },
  {
    name: "Sunset",
    value: "sunset",
    color: "bg-orange-500",
    style: { backgroundColor: '#F08A4B' },
  },
  {
    name: "Dark Slate",
    value: "darkslate",
    color: "bg-gray-800",
    style: { backgroundColor: '#191923' },
  },
  {
    name: "Crimson",
    value: "crimson",
    color: "bg-red-700",
    style: { backgroundColor: '#A30000' },
  },
  {
    name: "Midnight",
    value: "midnight",
    color: "bg-blue-900",
    style: { backgroundColor: '#17183B' },
  },
  {
    name: "Royal",
    value: "royal",
    color: "bg-blue-800",
    style: { backgroundColor: '#0E0E52' },
  },
  {
    name: "Deep Purple",
    value: "deep",
    color: "bg-purple-900",
    style: { backgroundColor: '#260F26' },
  },
];

const SCALED_THEMES = [
  {
    name: "Default",
    value: "default-scaled",
    color: "bg-blue-600",
  },
  {
    name: "Blue",
    value: "blue-scaled",
    color: "bg-blue-600",
  },
]

const MONO_THEMES = [
  {
    name: "Mono",
    value: "mono-scaled",
    color: "bg-stone-600",
  },
]

export function ThemeSelector() {
  const { activeTheme, setActiveTheme } = useThemeConfig()
  const [mounted, setMounted] = useState(false)

  // Prevent hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="flex items-center gap-2">
        <Label htmlFor="theme-selector" className="sr-only">
          Theme
        </Label>
        <Select disabled>
          <SelectTrigger
            id="theme-selector"
            size="sm"
            className="justify-start *:data-[slot=select-value]:w-12 w-full"
          >
            <span className="text-muted-foreground hidden sm:block">
              {/* Select a theme: */}
            </span>
            <span className="text-muted-foreground block sm:hidden">Theme</span>
            <SelectValue placeholder="Loading..." />
          </SelectTrigger>
        </Select>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Label htmlFor="theme-selector" className="sr-only">
        Theme
      </Label>
      <Select value={activeTheme} onValueChange={setActiveTheme}>
        <SelectTrigger
          id="theme-selector"
          size="sm"
          className="justify-start *:data-[slot=select-value]:w-12"
        >
          <span className="text-muted-foreground hidden sm:block">
            {/* Select a theme: */}
          </span>
          <span className="text-muted-foreground block sm:hidden">Theme</span>
          <SelectValue placeholder="Select a theme" />
        </SelectTrigger>
        <SelectContent align="end">
          <SelectGroup>
            <SelectLabel>Default</SelectLabel>
            {themes.map((theme: any) => (
              <SelectItem key={theme.name} value={theme.value}>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded-full border border-border"
                    style={theme.style || {}}
                  ></div>
                  <span>{theme.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectGroup>
          <SelectSeparator />
          <SelectGroup>
            <SelectLabel>Scaled</SelectLabel>
            {SCALED_THEMES.map((theme) => (
              <SelectItem key={theme.name} value={theme.value}>
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded-full ${theme.color}`}></div>
                  <span>{theme.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectGroup>
          <SelectGroup>
            <SelectLabel>Monospaced</SelectLabel>
            {MONO_THEMES.map((theme) => (
              <SelectItem key={theme.name} value={theme.value}>
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded-full ${theme.color}`}></div>
                  <span>{theme.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  )
}