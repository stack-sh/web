import { Moon, Sun } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import type { ColorMode } from "@/lib/color-mode"

interface ColorModeToggleProps {
  colorMode: ColorMode
  onColorModeChange: (colorMode: ColorMode) => void
}

export function ColorModeToggle({ colorMode, onColorModeChange }: ColorModeToggleProps) {
  const nextMode = colorMode === "light" ? "dark" : "light"

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          aria-label={`Switch to ${nextMode} mode`}
          onClick={() => onColorModeChange(nextMode)}
          size="icon-sm"
          variant="ghost"
        >
          {colorMode === "light" ? <Moon aria-hidden="true" /> : <Sun aria-hidden="true" />}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">{`Use ${nextMode} mode`}</TooltipContent>
    </Tooltip>
  )
}
