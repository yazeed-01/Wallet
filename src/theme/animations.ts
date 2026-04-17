// Animation Configurations
export const animations = {
  // Durations (in milliseconds)
  duration: {
    fast: 150,
    normal: 250,
    slow: 350,
  },

  // Easing
  easing: {
    easeInOut: 'ease-in-out',
    easeOut: 'ease-out',
    easeIn: 'ease-in',
    linear: 'linear',
  },

  // Spring Configurations (for Reanimated)
  spring: {
    default: {
      damping: 15,
      stiffness: 150,
      mass: 1,
    },
    bouncy: {
      damping: 10,
      stiffness: 100,
      mass: 1,
    },
    stiff: {
      damping: 20,
      stiffness: 200,
      mass: 1,
    },
  },

  // Timing Configurations
  timing: {
    fast: {
      duration: 150,
    },
    normal: {
      duration: 250,
    },
    slow: {
      duration: 350,
    },
  },
};

// Common Animation Presets
export const animationPresets = {
  // Fade
  fadeIn: {
    from: { opacity: 0 },
    to: { opacity: 1 },
    duration: animations.duration.normal,
  },
  fadeOut: {
    from: { opacity: 1 },
    to: { opacity: 0 },
    duration: animations.duration.normal,
  },

  // Scale
  scaleIn: {
    from: { opacity: 0, scale: 0.9 },
    to: { opacity: 1, scale: 1 },
    duration: animations.duration.normal,
  },
  scaleOut: {
    from: { opacity: 1, scale: 1 },
    to: { opacity: 0, scale: 0.9 },
    duration: animations.duration.normal,
  },

  // Slide
  slideInUp: {
    from: { opacity: 0, translateY: 20 },
    to: { opacity: 1, translateY: 0 },
    duration: animations.duration.normal,
  },
  slideInDown: {
    from: { opacity: 0, translateY: -20 },
    to: { opacity: 1, translateY: 0 },
    duration: animations.duration.normal,
  },

  // Press
  pressIn: {
    from: { scale: 1 },
    to: { scale: 0.95 },
    duration: animations.duration.fast,
  },
  pressOut: {
    from: { scale: 0.95 },
    to: { scale: 1 },
    duration: animations.duration.fast,
  },
};
