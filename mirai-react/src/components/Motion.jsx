import { motion } from 'framer-motion'

const MotionDiv = motion.div

const offsets = {
  up: { y: 40, x: 0 },
  down: { y: -40, x: 0 },
  left: { x: 40, y: 0 },
  right: { x: -40, y: 0 },
  none: { x: 0, y: 0 },
}

export function FadeIn({ children, delay = 0, direction = 'up', className = '' }) {
  return (
    <MotionDiv
      initial={{ opacity: 0, ...offsets[direction] }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.7, delay, ease: [0.25, 0.25, 0, 1] }}
      className={className}
    >
      {children}
    </MotionDiv>
  )
}

export function StaggerContainer({ children, className = '' }) {
  return (
    <MotionDiv
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-100px' }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.15 } } }}
      className={className}
    >
      {children}
    </MotionDiv>
  )
}

export function StaggerItem({ children, className = '' }) {
  return (
    <MotionDiv
      variants={{
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
      }}
      className={className}
    >
      {children}
    </MotionDiv>
  )
}
