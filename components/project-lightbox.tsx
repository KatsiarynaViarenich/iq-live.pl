"use client"

import Image from "next/image"
import { useState, useEffect, useCallback, useRef } from "react"
import { X, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface ProjectLightboxProps {
  isOpen: boolean
  onClose: () => void
  projectTitle: string
  projectCategory: string
  projectDescription: string
  projectLocation: string
  projectYear: string
  images: string[]
}

const SNAP_DURATION = 380
const SNAP_EASING = "cubic-bezier(0.22, 1, 0.36, 1)"

export function ProjectLightbox({
  isOpen,
  onClose,
  projectTitle,
  projectCategory,
  projectDescription,
  projectLocation,
  projectYear,
  images,
}: ProjectLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  // dragOffset = live px offset while finger is down
  const [dragOffset, setDragOffset] = useState(0)
  // extraOffset = animated px offset used during snap (next = -100%, prev = +100%)
  // expressed as percentage string so no offsetWidth needed
  const [snapState, setSnapState] = useState<"idle" | "snapping">("idle")
  const [snapTargetPercent, setSnapTargetPercent] = useState(0) // -100 | 0 | 100
  const [isDragging, setIsDragging] = useState(false)
  const [resetting, setResetting] = useState(false)

  const touchStartX = useRef<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const stripRef = useRef<HTMLDivElement>(null)
  const pendingDirectionRef = useRef<"next" | "prev" | null>(null)

  const prevIndex = (currentIndex - 1 + images.length) % images.length
  const nextIndex = (currentIndex + 1) % images.length

  // --- FIX 3: use percentage-based transform, no offsetWidth needed ---
  // Base position: strip sits at -33.333% (center slot visible).
  // During drag: offset by dragOffset px via calc().
  // During snap: shift by additional ±33.333% via snapTargetPercent.
  const translateValue = resetting
    ? "translateX(-33.333%)"
    : snapState === "snapping"
      ? `translateX(calc(-33.333% + ${snapTargetPercent}%))`
      : `translateX(calc(-33.333% + ${dragOffset}px))`

  const animateSwipe = useCallback((direction: "next" | "prev") => {
    pendingDirectionRef.current = direction
    setSnapState("snapping")
    setSnapTargetPercent(direction === "next" ? -33.333 : 33.333)
  }, [])

  // --- FIX 4: guard on propertyName so only transform triggers the reset ---
  const handleStripTransitionEnd = useCallback(
    (e: React.TransitionEvent<HTMLDivElement>) => {
      if (e.propertyName !== "transform") return
      if (snapState !== "snapping" || resetting) return

      const direction = pendingDirectionRef.current
      if (!direction) return
      pendingDirectionRef.current = null

      // Disable transition, jump index, reset percent — all invisible
      setResetting(true)
      setCurrentIndex((prev) =>
        direction === "next"
          ? (prev + 1) % images.length
          : (prev - 1 + images.length) % images.length
      )
      setSnapTargetPercent(0)
      setDragOffset(0)

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setResetting(false)
          setSnapState("idle")
        })
      })
    },
    [snapState, resetting, images.length]
  )

  const handlePrevious = useCallback(() => animateSwipe("prev"), [animateSwipe])
  const handleNext = useCallback(() => animateSwipe("next"), [animateSwipe])

  // --- FIX 1: thumbnail click animates via animateSwipe instead of jumping ---
  const handleThumbnailClick = useCallback(
    (index: number) => {
      if (snapState !== "idle" || index === currentIndex) return
      // Determine natural direction: forward or backward in the array
      const forward =
        (index - currentIndex + images.length) % images.length <=
        images.length / 2
      animateSwipe(forward ? "next" : "prev")
      // We want to land on `index`, not just ±1. For multi-step jumps we
      // update currentIndex immediately so the pre-loaded slot shows the
      // right image while the animation plays.
      setCurrentIndex(index)
    },
    [snapState, currentIndex, images.length, animateSwipe]
  )

  // Keyboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return
      if (e.key === "Escape") onClose()
      if (e.key === "ArrowLeft") handlePrevious()
      if (e.key === "ArrowRight") handleNext()
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, onClose, handlePrevious, handleNext])

  // Lock scroll + browser back button
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
      window.history.pushState({ lightbox: true }, "")
      const handlePopState = () => onClose()
      window.addEventListener("popstate", handlePopState)
      return () => {
        window.removeEventListener("popstate", handlePopState)
        document.body.style.overflow = "unset"
      }
    } else {
      document.body.style.overflow = "unset"
    }
  }, [isOpen, onClose])

  useEffect(() => {
    setCurrentIndex(0)
    setDragOffset(0)
    setSnapTargetPercent(0)
    setSnapState("idle")
  }, [isOpen])

  const handleTouchStart = (e: React.TouchEvent) => {
    if (snapState !== "idle") return
    touchStartX.current = e.touches[0].clientX
    setIsDragging(true)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null || snapState !== "idle") return
    setDragOffset(e.touches[0].clientX - touchStartX.current)
  }

  // --- FIX 2: don't zero dragOffset before rAF — transition is still off ---
  // Instead, keep isDragging=true until rAF so the zero-reset is invisible,
  // then in the same frame switch both off and start the snap.
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    touchStartX.current = null

    if (Math.abs(dx) > 50) {
      const direction = dx < 0 ? "next" : "prev"
      // Still in isDragging=true, so transition is suppressed.
      // Zero the drag offset silently, then on next frame enable transition
      // and kick off the snap animation — no visible jump.
      setDragOffset(0)
      requestAnimationFrame(() => {
        setIsDragging(false)
        animateSwipe(direction)
      })
    } else {
      // Below threshold — animate bounce-back to center
      setIsDragging(false)
      setDragOffset(0)
    }
  }

  if (!isOpen) return null

  const isAnimating = snapState === "snapping"
  const transitionStyle =
    isDragging || resetting
      ? "none"
      : `transform ${SNAP_DURATION}ms ${SNAP_EASING}`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-foreground/95 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-6">
          <div className="text-card">
            <p className="text-card/60 text-sm uppercase tracking-wide mb-1">{projectCategory}</p>
            <h2 className="font-serif text-xl md:text-2xl">{projectTitle}</h2>
          </div>
          <button onClick={onClose} className="p-2 text-card/80 hover:text-card transition-colors" aria-label="Close">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Swipeable carousel */}
        <div
          ref={containerRef}
          className="flex-1 relative overflow-hidden"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div
            ref={stripRef}
            className="flex h-full"
            onTransitionEnd={handleStripTransitionEnd}
            style={{
              width: "300%",
              transform: translateValue,
              transition: transitionStyle,
            }}
          >
            {[prevIndex, currentIndex, nextIndex].map((imgIdx, slotIdx) => (
              <div
                key={slotIdx}
                className="flex items-center justify-center px-10 md:px-16"
                style={{ width: "33.333%" }}
              >
                <div className="relative w-full h-full max-w-5xl max-h-[70vh]">
                  <Image
                    src={images[imgIdx]}
                    alt={slotIdx === 1 ? `${projectTitle} – ${currentIndex + 1}` : ""}
                    fill
                    className="object-contain"
                    priority={slotIdx === 1}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Arrows */}
          <button
            onClick={handlePrevious}
            disabled={isAnimating}
            className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 z-10 p-2 md:p-3 bg-card/10 hover:bg-card/20 text-card rounded-full transition-colors disabled:opacity-40"
            aria-label="Previous"
          >
            <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
          </button>
          <button
            onClick={handleNext}
            disabled={isAnimating}
            className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 z-10 p-2 md:p-3 bg-card/10 hover:bg-card/20 text-card rounded-full transition-colors disabled:opacity-40"
            aria-label="Next"
          >
            <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
          </button>
        </div>

        {/* Footer */}
        <div className="p-4 md:p-6">
          <div className="text-center mb-4">
            <p className="text-card/70 text-sm max-w-2xl mx-auto">{projectDescription}</p>
            <div className="flex items-center justify-center gap-4 text-card/50 text-sm mt-2">
              <span>{projectLocation}</span>
              <span>•</span>
              <span>{projectYear}</span>
            </div>
          </div>

          {/* Thumbnails */}
          <div className="flex items-center justify-center gap-2 md:gap-3">
            {images.map((image, index) => (
              <button
                key={index}
                onClick={() => handleThumbnailClick(index)}
                className={cn(
                  "relative w-12 h-12 md:w-16 md:h-16 overflow-hidden transition-all",
                  currentIndex === index
                    ? "ring-2 ring-primary opacity-100"
                    : "opacity-50 hover:opacity-80"
                )}
              >
                <Image src={image} alt={`Thumbnail ${index + 1}`} fill className="object-cover" />
              </button>
            ))}
          </div>

          <div className="text-center mt-3">
            <span className="text-card/60 text-sm">{currentIndex + 1} / {images.length}</span>
          </div>
        </div>
      </div>
    </div>
  )
}