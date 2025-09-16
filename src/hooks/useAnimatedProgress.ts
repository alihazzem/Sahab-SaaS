import { useEffect, useState } from 'react'

interface UseAnimatedProgressProps {
    targetProgress: number
    duration?: number
    enabled?: boolean
}

export function useAnimatedProgress({
    targetProgress,
    duration = 300,
    enabled = true
}: UseAnimatedProgressProps) {
    const [animatedProgress, setAnimatedProgress] = useState(targetProgress)

    useEffect(() => {
        if (!enabled) {
            setAnimatedProgress(targetProgress)
            return
        }

        const startProgress = animatedProgress
        const progressDiff = targetProgress - startProgress
        const startTime = Date.now()

        if (progressDiff === 0) return

        const animateProgress = () => {
            const elapsed = Date.now() - startTime
            const progress = Math.min(elapsed / duration, 1)

            // Easing function for smoother animation
            const easeOutQuart = 1 - Math.pow(1 - progress, 4)
            const currentProgress = startProgress + (progressDiff * easeOutQuart)

            setAnimatedProgress(currentProgress)

            if (progress < 1) {
                requestAnimationFrame(animateProgress)
            } else {
                setAnimatedProgress(targetProgress)
            }
        }

        requestAnimationFrame(animateProgress)
    }, [targetProgress, duration, enabled, animatedProgress])

    return Math.round(animatedProgress)
}