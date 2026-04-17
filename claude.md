# AGENTS.md - AI Agent Guidelines for Crowd React Native Project

> This document provides guidelines for AI coding assistants (Claude, Cursor, Copilot, etc.) when working on this React Native/Expo codebase.

---

## 🚀 Quick Start for AI Agents

**IMPORTANT**: Before working on this codebase, **ALWAYS CHECK `PROJECT_STRUCTURE.md` FIRST**.

### Why Use PROJECT_STRUCTURE.md?

- **Reduces token usage by 60-80%** - No need to read all files to understand the project
- **Instant project overview** - See folder organization, file counts, and key locations
- **Code conventions** - Performance rules, naming patterns, and best practices at a glance
- **Navigation patterns** - How to pass data, handle iOS/Android differences

### When to Regenerate PROJECT_STRUCTURE.md

```bash
# Run this command after:
npm run structure
# OR
bash generate-structure.sh
```

**Regenerate when:**
- ✓ Adding new screens or features
- ✓ Creating new directories
- ✓ Major refactoring or restructuring
- ✗ Don't run for every small file edit

---

## Project Overview

- **Framework:** React Native 0.79.0 with Expo SDK 53
- **Language:** JavaScript (components) + TypeScript (data structures, services)
- **State Management:** Redux Toolkit + React Context API
- **Navigation:** React Navigation v6
- **Backend:** Firebase (Auth, Database, Messaging)
- **Video Processing:** FFmpeg, expo-av, Vision Camera, VLC

---

## Code Style & Conventions

### DO ✓

- Use **functional components** with hooks (no class components)
- Follow existing naming conventions:
  - `PascalCase` for components and classes
  - `camelCase` for functions and variables
  - `UPPER_SNAKE_CASE` for constants and enums
  - `use*` prefix for custom hooks
- Use single quotes for strings
- Add trailing commas on multi-line structures
- Keep components small and focused (single responsibility)
- Import directly from source files, avoid barrel exports
- Use TypeScript for new data structures and services
- Follow existing patterns in the codebase before introducing new ones
- Use **FlatList** for all lists (never ScrollView with .map())
- Optimize with **React.memo**, **useCallback**, **useMemo** where appropriate

### DON'T ✗

- Don't create class components
- Don't use `var` - use `const` or `let`
- Don't add unnecessary comments - code should be self-documenting
- Don't introduce new state management libraries without discussion
- Don't use inline styles for complex styling - use StyleSheet
- Don't hardcode sensitive values (API keys, URLs, credentials)
- Don't ignore existing patterns in favor of "better" approaches
- Don't use ScrollView for long lists (use FlatList instead)
- Don't forget to optimize FlatList (removeClippedSubviews, keyExtractor, React.memo)

---

## Documentation & Comments

**CRITICAL**: While code should be self-documenting, all functions, components, hooks, and utilities MUST have structured comments.

### Function/Component Documentation

**Always add a comment block above** functions, components, hooks, and utilities with the following structure:

```javascript
/**
 * Purpose: Brief description of what this function/component does
 * 
 * Inputs:
 *   - paramName (type): Description of parameter and expected values
 *   - anotherParam (type): Description
 * 
 * Outputs:
 *   - Returns (type): Description of return value
 * 
 * Side effects:
 *   - Describe any global state changes
 *   - Describe any API calls
 *   - Describe any UI updates
 *   - Describe any navigation actions
 *   - Note if there are no side effects
 */
```

### Examples

#### Function Example

```javascript
/**
 * Purpose: Validates and sanitizes event ID for database queries
 * 
 * Inputs:
 *   - eventId (string): Raw event ID from user input or navigation params
 * 
 * Outputs:
 *   - Returns (boolean): true if valid, false otherwise
 * 
 * Side effects: None
 */
const isValidEventId = (eventId) => {
  if (typeof eventId !== 'string') return false;
  return /^[a-zA-Z0-9_-]+$/.test(eventId);
};
```

#### Component Example

```javascript
/**
 * Purpose: Displays a video thumbnail with metadata in event gallery
 * 
 * Inputs:
 *   - video (VideoData): Video object containing id, thumbnail, title, duration
 *   - onPress (function): Callback when video is pressed, receives videoId
 *   - isLiked (boolean): Whether current user has liked this video
 * 
 * Outputs:
 *   - Returns (JSX.Element): Memoized video card component
 * 
 * Side effects: None (pure component, callbacks handle side effects)
 */
const VideoCard = React.memo(({ video, onPress, isLiked }) => {
  // Component implementation
});
```

#### Hook Example

```javascript
/**
 * Purpose: Manages video playback state and controls for video player
 * 
 * Inputs:
 *   - videoUri (string): URL or local path to video file
 *   - autoPlay (boolean): Whether to start playing automatically
 * 
 * Outputs:
 *   - Returns (object): {
 *       isPlaying: boolean,
 *       duration: number,
 *       currentTime: number,
 *       play: function,
 *       pause: function,
 *       seek: function
 *     }
 * 
 * Side effects:
 *   - Subscribes to video player events
 *   - Updates playback state
 *   - Cleans up subscriptions on unmount
 */
const useVideoPlayer = (videoUri, autoPlay = false) => {
  // Hook implementation
};
```

#### Utility Function Example

```javascript
/**
 * Purpose: Converts timestamp to human-readable relative time (e.g., "2 hours ago")
 * 
 * Inputs:
 *   - timestamp (number | Date): Unix timestamp or Date object
 *   - language (string): 'English' or 'Arabic' for localization
 * 
 * Outputs:
 *   - Returns (string): Formatted relative time string
 * 
 * Side effects: None
 */
const formatRelativeTime = (timestamp, language = 'English') => {
  // Utility implementation
};
```

### IMPORTANT: Keep Comments Updated

**When you modify a function/component/hook:**
1. ✓ Update the comment block to reflect changes
2. ✓ Update Inputs if parameters changed
3. ✓ Update Outputs if return value changed
4. ✓ Update Side effects if behavior changed
5. ✓ Update Purpose if functionality changed

**Outdated comments are worse than no comments** - they mislead developers and cause bugs.

### When Comments Are Optional

- Very simple one-liner functions (e.g., `const add = (a, b) => a + b`)
- Private helper functions inside a component (if obvious)
- Auto-generated code or boilerplate

---

## Internationalization (i18n)

### UI Text Management

**CRITICAL**: All user-facing text MUST support both English and Arabic.

### DO ✓

- **Always** add UI strings to the centralized string files:
  - `Components/strings.js` - For regular UI text (buttons, labels, headers, etc.)
  - `Components/alertStrings.js` - For alert messages, dialogs, and notifications
- Define strings in both `English` and `Arabic` keys
- Use the existing string structure pattern:
  ```javascript
  ComponentName: {
    English: {
      StringKey: "English text here"
    },
    Arabic: {
      StringKey: "النص العربي هنا"
    }
  }
  ```
- Reference strings from components using the language context

### DON'T ✗

- Don't hardcode UI text directly in components
- Don't create UI text that exists in only one language
- Don't add UI strings outside of `strings.js` or `alertStrings.js`
- Don't skip translation - every English string needs an Arabic equivalent

### Example

```javascript
// ✓ CORRECT - Using centralized strings
import { strings } from '../Components/strings';
const text = strings.CameraScreen.English.Live;

// ✗ WRONG - Hardcoded text
const text = "Live Upload";
```

---

## File Structure

```
Screens/          → Feature screens (NewCrowdPage, Camera, Profile, etc.)
Components/       → Reusable UI components
Services/         → Business logic, API calls, utilities
hooks/            → Custom React hooks
contexts/         → React Context providers
DataStructures/   → TypeScript types, interfaces, enums
navigation/       → Navigation configuration
constants/        → App-wide constants
utils/            → Utility functions
```

### When Creating New Files

- **New screen?** → `Screens/[FeatureName]/[FeatureName]Screen.js`
  - Add to navigation stack in `navigation/` folder
  - Configure header with back button for iOS
  - Handle Android back button if custom behavior needed
  - Set appropriate animation (modal/slide/fade)
- **New component?** → `Components/[FeatureName]Components/[ComponentName].js`
- **New hook?** → `hooks/use[HookName].js`
- **New service?** → `Services/[ServiceName].js` or `.ts`
- **New types?** → `DataStructures/[TypeName].ts`

---

## State Management

### Redux (Global State)

Use Redux Toolkit for complex, app-wide state:

```javascript
// Creating a slice
import {createSlice} from '@reduxjs/toolkit';

const MySlice = createSlice({
  name: 'myFeature',
  initialState: initialValue,
  reducers: {
    setValue: (state, action) => {
      state.field = action.payload;
    },
  },
});

export default MySlice.reducer;
export const {setValue} = MySlice.actions;
```





## Navigation Best Practices

### Screen Navigation (React Navigation v6)

**CRITICAL**: Navigation works differently on iOS and Android - always test both platforms.

#### DO ✓

- **Always** provide a back button/header for iOS screens (iOS has no built-in back button like Android)
- Use `navigation.goBack()` for simple back navigation
- Pass **small, serializable data** via route params (IDs, flags, simple strings)
- Use Redux or Context for **large or complex data** (objects, arrays, functions)
- Handle Android hardware back button with `BackHandler` when needed
- Test navigation flow on both iOS and Android

#### DON'T ✗

- Don't pass large objects, arrays, or functions through navigation params
- Don't forget to add header navigation for iOS
- Don't ignore Android hardware back button behavior
- Don't assume navigation works the same on both platforms
- Don't forget to configure appropriate animations (modal, slide, fade)
- Don't use slow animations (keep under 300ms)

### Passing Data Between Screens

```javascript
// ✓ CORRECT - Small data via params
navigation.navigate('EventDetails', {
  eventId: '12345',
  shouldRefresh: true
});

// Then retrieve in target screen:
const { eventId } = route.params;

// ✓ CORRECT - Large data via Redux/Context
// Store the event object in Redux first, then navigate
dispatch(setSelectedEvent(eventObject));
navigation.navigate('EventDetails', { eventId: event.id });

// ✗ WRONG - Large object via params (causes performance issues)
navigation.navigate('EventDetails', {
  event: largeEventObject,  // Too large!
  users: arrayOfUsers,      // Too large!
  callback: () => {}        // Functions can't be serialized!
});
```

### iOS Header Navigation

**Always add a header with back button for iOS** - iOS doesn't have Android's system back button:

```javascript
// Method 1: Stack Navigator options
<Stack.Screen
  name="EventDetails"
  component={EventDetailsScreen}
  options={{
    headerShown: true,
    headerBackTitle: 'Back',  // iOS back button text
    title: 'Event Details'
  }}
/>

// Method 2: Custom header with arrow
useLayoutEffect(() => {
  navigation.setOptions({
    headerLeft: () => (
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={{ paddingLeft: 15 }}
      >
        <Icon name="arrow-back" size={24} color="#000" />
      </TouchableOpacity>
    ),
  });
}, [navigation]);
```

### Android Hardware Back Button

**Handle Android's built-in back button** for custom behaviors:

```javascript
import { BackHandler } from 'react-native';

useEffect(() => {
  const backAction = () => {
    // Custom back button logic
    if (hasUnsavedChanges) {
      Alert.alert(
        'Discard changes?',
        'You have unsaved changes.',
        [
          { text: 'Cancel', onPress: () => null, style: 'cancel' },
          { text: 'Discard', onPress: () => navigation.goBack() }
        ]
      );
      return true; // Prevent default back behavior
    }
    return false; // Allow default back behavior
  };

  const backHandler = BackHandler.addEventListener(
    'hardwareBackPress',
    backAction
  );

  return () => backHandler.remove(); // Cleanup!
}, [hasUnsavedChanges, navigation]);
```

### Common Navigation Patterns

```javascript
// Go back
navigation.goBack();

// Navigate to a screen
navigation.navigate('ScreenName', { param: 'value' });

// Replace current screen (can't go back)
navigation.replace('ScreenName');

// Reset navigation stack
navigation.reset({
  index: 0,
  routes: [{ name: 'Home' }],
});

// Navigate to nested navigator
navigation.navigate('MainStack', {
  screen: 'Profile',
  params: { userId: '123' }
});
```

### Navigation Animations

**IMPORTANT**: Always configure smooth transitions for better UX. Default animations differ by platform (iOS: slide, Android: fade).

#### Screen Transition Animations

```javascript
// Default stack animation (slide from right on iOS)
<Stack.Screen
  name="EventDetails"
  component={EventDetailsScreen}
  options={{
    animation: 'slide_from_right',  // iOS default
  }}
/>

// Modal presentation (slide from bottom)
<Stack.Screen
  name="CreateEvent"
  component={CreateEventScreen}
  options={{
    presentation: 'modal',  // Full screen modal
    animation: 'slide_from_bottom',
  }}
/>

// Card modal (transparent background)
<Stack.Screen
  name="ImagePreview"
  component={ImagePreviewScreen}
  options={{
    presentation: 'transparentModal',
    animation: 'fade',
  }}
/>

// Fade animation
<Stack.Screen
  name="Settings"
  component={SettingsScreen}
  options={{
    animation: 'fade',
  }}
/>

// No animation
<Stack.Screen
  name="SplashScreen"
  component={SplashScreen}
  options={{
    animation: 'none',
  }}
/>
```

#### Custom Transition Animations

```javascript
// Custom slide and fade
<Stack.Screen
  name="Profile"
  component={ProfileScreen}
  options={{
    transitionSpec: {
      open: {
        animation: 'timing',
        config: { duration: 300 }
      },
      close: {
        animation: 'timing',
        config: { duration: 250 }
      }
    },
    cardStyleInterpolator: ({ current, layouts }) => ({
      cardStyle: {
        transform: [
          {
            translateX: current.progress.interpolate({
              inputRange: [0, 1],
              outputRange: [layouts.screen.width, 0],
            }),
          },
        ],
        opacity: current.progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 1],
        }),
      },
    }),
  }}
/>
```

#### Animation Types Available

```javascript
// React Navigation animation options:
animation: 'default'           // Platform default
animation: 'fade'             // Fade in/out
animation: 'slide_from_right' // Slide from right (iOS default)
animation: 'slide_from_left'  // Slide from left
animation: 'slide_from_bottom' // Slide from bottom (modal style)
animation: 'none'             // No animation
animation: 'simple_push'      // Simple push animation
animation: 'ios'              // iOS-style slide
animation: 'fade_from_bottom' // Fade and slide from bottom
```

#### Gesture Configuration

```javascript
// Enable/disable swipe gestures
<Stack.Screen
  name="EventDetails"
  component={EventDetailsScreen}
  options={{
    gestureEnabled: true,  // Enable swipe to go back
    gestureDirection: 'horizontal',  // or 'vertical' for modal
    fullScreenGestureEnabled: true,  // iOS: swipe from anywhere
  }}
/>

// Disable gestures (e.g., for critical forms)
<Stack.Screen
  name="PaymentForm"
  component={PaymentFormScreen}
  options={{
    gestureEnabled: false,  // Disable swipe back
  }}
/>
```

#### Platform-Specific Animations

```javascript
import { Platform } from 'react-native';

<Stack.Screen
  name="EventDetails"
  component={EventDetailsScreen}
  options={{
    animation: Platform.OS === 'ios' ? 'slide_from_right' : 'fade',
    presentation: Platform.OS === 'ios' ? 'card' : 'modal',
  }}
/>
```

#### Best Practices for Animations

- Use **modal presentation** (`slide_from_bottom`) for create/edit screens
- Use **default slide** for detail/drill-down screens
- Use **fade** for settings/static screens
- **Disable gestures** on forms with unsaved data
- Keep animation duration **short** (200-300ms) for snappy feel
- Test animations on **real devices** (emulators can be choppy)

---

## Performance Optimization

**CRITICAL**: Poor performance kills user experience. Always optimize for smooth 60 FPS rendering.

### FlatList Optimization

**ALWAYS use FlatList for lists** - Never use ScrollView with .map() for long lists (especially video lists!).

#### Essential FlatList Props

```javascript
// ✓ CORRECT - Optimized FlatList for video gallery
<FlatList
  data={videos}
  keyExtractor={(item) => item.id}  // Unique key, NOT index!
  renderItem={renderVideoItem}

  // Performance props
  removeClippedSubviews={true}  // Unmount off-screen items (huge performance boost!)
  maxToRenderPerBatch={10}      // Render 10 items per batch
  updateCellsBatchingPeriod={50} // Batch updates every 50ms
  initialNumToRender={10}        // Render 10 items initially
  windowSize={5}                 // Keep 5 screens worth of items in memory

  // Memory optimization
  getItemLayout={(data, index) => ({  // If items have fixed height
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  })}
/>

// ✗ WRONG - ScrollView with map (causes massive performance issues)
<ScrollView>
  {videos.map((video) => (
    <VideoItem key={video.id} video={video} />
  ))}
</ScrollView>
```

#### Optimize renderItem with React.memo

```javascript
// ✓ CORRECT - Memoized item component
const VideoItem = React.memo(({ item, onPress }) => {
  return (
    <TouchableOpacity onPress={() => onPress(item.id)}>
      <Image source={{ uri: item.thumbnail }} />
      <Text>{item.title}</Text>
    </TouchableOpacity>
  );
});

// Use with FlatList
const renderVideoItem = useCallback(({ item }) => (
  <VideoItem item={item} onPress={handleVideoPress} />
), [handleVideoPress]);

<FlatList
  data={videos}
  renderItem={renderVideoItem}
  keyExtractor={(item) => item.id}
/>
```

#### Video-Specific Optimizations

```javascript
// For video thumbnail lists
<FlatList
  data={videos}
  keyExtractor={(item) => item.id}
  renderItem={renderVideoItem}

  // Critical for video lists
  removeClippedSubviews={true}
  maxToRenderPerBatch={5}        // Fewer items for video thumbnails
  initialNumToRender={6}         // Show ~2 rows initially
  windowSize={3}                 // Smaller window for memory

  // Prevent layout jumps
  getItemLayout={getItemLayout}  // If all items same height

  // Lazy loading
  onEndReached={loadMoreVideos}
  onEndReachedThreshold={0.5}    // Load more at 50% scroll
/>
```

### React.memo - Prevent Unnecessary Re-renders

Use `React.memo` to prevent re-rendering when props haven't changed.

```javascript
// ✓ CORRECT - Memoized component
const EventCard = React.memo(({ event, onPress }) => {
  console.log('EventCard rendered'); // Should only log when event changes

  return (
    <TouchableOpacity onPress={() => onPress(event.id)}>
      <Text>{event.name}</Text>
      <Text>{event.date}</Text>
    </TouchableOpacity>
  );
});

// ✗ WRONG - No memoization
const EventCard = ({ event, onPress }) => {
  console.log('EventCard rendered'); // Logs on EVERY parent re-render!

  return (
    <TouchableOpacity onPress={() => onPress(event.id)}>
      <Text>{event.name}</Text>
      <Text>{event.date}</Text>
    </TouchableOpacity>
  );
};
```

#### When to use React.memo

- **DO use** for list items (FlatList renderItem components)
- **DO use** for complex components that receive stable props
- **DO use** for components that render often but props rarely change
- **DON'T use** for simple components (overhead not worth it)
- **DON'T use** if props change frequently

### useCallback - Memoize Functions

Prevent creating new function instances on every render.

```javascript
// ✓ CORRECT - Memoized callback
const VideoListScreen = () => {
  const [videos, setVideos] = useState([]);

  // Function reference stays the same across re-renders
  const handleVideoPress = useCallback((videoId) => {
    navigation.navigate('VideoPlayer', { videoId });
  }, [navigation]);  // Only recreate if navigation changes

  const handleVideoLike = useCallback((videoId) => {
    // Update video like status
    setVideos(prev =>
      prev.map(v => v.id === videoId ? { ...v, liked: true } : v)
    );
  }, []);  // No dependencies, never recreates

  return (
    <FlatList
      data={videos}
      renderItem={({ item }) => (
        <VideoItem
          item={item}
          onPress={handleVideoPress}  // Same function reference
          onLike={handleVideoLike}    // Same function reference
        />
      )}
    />
  );
};

// ✗ WRONG - New function created on EVERY render
const VideoListScreen = () => {
  const [videos, setVideos] = useState([]);

  // New function instance on every render = child re-renders
  const handleVideoPress = (videoId) => {
    navigation.navigate('VideoPlayer', { videoId });
  };

  return (
    <FlatList
      data={videos}
      renderItem={({ item }) => (
        <VideoItem
          item={item}
          onPress={handleVideoPress}  // Different function every render!
        />
      )}
    />
  );
};
```

#### useCallback Best Practices

```javascript
// ✓ CORRECT - Callback with dependencies
const handleSearch = useCallback((query) => {
  const filtered = videos.filter(v =>
    v.title.toLowerCase().includes(query.toLowerCase())
  );
  setFilteredVideos(filtered);
}, [videos]);  // Recreate when videos change

// ✓ CORRECT - Callback with no dependencies
const handleRefresh = useCallback(() => {
  setRefreshing(true);
  fetchVideos().finally(() => setRefreshing(false));
}, []);  // Never recreates

// ✗ WRONG - Missing dependency
const handleSearch = useCallback((query) => {
  const filtered = videos.filter(v =>
    v.title.toLowerCase().includes(query.toLowerCase())
  );
  setFilteredVideos(filtered);
}, []);  // ❌ Should include [videos]!
```

### useMemo - Memoize Expensive Calculations

Cache expensive computations between re-renders.

```javascript
// ✓ CORRECT - Memoized expensive calculation
const EventListScreen = () => {
  const [events, setEvents] = useState([]);
  const [filter, setFilter] = useState('all');

  // Only recalculate when events or filter change
  const filteredEvents = useMemo(() => {
    console.log('Filtering events...'); // Should only log when deps change

    if (filter === 'all') return events;

    return events.filter(event => {
      // Expensive filtering logic
      return event.category === filter;
    });
  }, [events, filter]);  // Recalculate only when these change

  // Only recalculate when filteredEvents change
  const eventStats = useMemo(() => {
    console.log('Calculating stats...');

    return {
      total: filteredEvents.length,
      upcoming: filteredEvents.filter(e => new Date(e.date) > new Date()).length,
      past: filteredEvents.filter(e => new Date(e.date) <= new Date()).length,
    };
  }, [filteredEvents]);

  return (
    <View>
      <Text>Total: {eventStats.total}</Text>
      <FlatList data={filteredEvents} />
    </View>
  );
};

// ✗ WRONG - Recalculates on EVERY render
const EventListScreen = () => {
  const [events, setEvents] = useState([]);
  const [filter, setFilter] = useState('all');

  // Runs on EVERY render, even if events/filter haven't changed!
  const filteredEvents = events.filter(event => {
    if (filter === 'all') return true;
    return event.category === filter;
  });

  return <FlatList data={filteredEvents} />;
};
```

#### useMemo Best Practices

```javascript
// ✓ CORRECT - Memoize expensive operations
const sortedVideos = useMemo(() => {
  return [...videos].sort((a, b) => b.uploadDate - a.uploadDate);
}, [videos]);

// ✓ CORRECT - Memoize object/array creation for dependencies
const videoConfig = useMemo(() => ({
  quality: 'high',
  autoplay: false,
  muted: isMuted,
}), [isMuted]);

// ✗ WRONG - Memoizing simple operations (unnecessary overhead)
const userName = useMemo(() => user.name, [user]);  // Just use user.name directly!

// ✗ WRONG - Missing dependencies
const sortedVideos = useMemo(() => {
  return [...videos].sort((a, b) => b.uploadDate - a.uploadDate);
}, []);  // ❌ Should include [videos]!
```

### Performance Checklist

- [ ] Use **FlatList** (not ScrollView) for all lists
- [ ] Add `keyExtractor` with unique IDs (not array index)
- [ ] Set `removeClippedSubviews={true}` on FlatLists
- [ ] Wrap list item components with **React.memo**
- [ ] Use **useCallback** for functions passed to child components
- [ ] Use **useMemo** for expensive calculations or filtering
- [ ] Optimize images (compress, use appropriate sizes)
- [ ] Test performance on **low-end devices** (not just high-end)

### Performance Anti-Patterns to Avoid

```javascript
// ❌ WRONG - Anonymous function in renderItem
<FlatList
  renderItem={({ item }) => <VideoItem item={item} onPress={(id) => handlePress(id)} />}
/>

// ❌ WRONG - Creating objects/arrays in render
<VideoPlayer config={{ quality: 'high', autoplay: false }} />  // New object every render!

// ❌ WRONG - Using array index as key
<FlatList
  data={videos}
  keyExtractor={(item, index) => index.toString()}  // Causes re-render issues!
/>

// ❌ WRONG - Missing dependencies in hooks
const filtered = useMemo(() => videos.filter(v => v.liked), []);  // Missing [videos]!

// ❌ WRONG - Using ScrollView for long lists
<ScrollView>
  {videos.map(v => <VideoItem key={v.id} video={v} />)}  // Use FlatList instead!
</ScrollView>
```

---

## Memory Leak Prevention

### CRITICAL: Always Clean Up useEffect

```javascript
// ✓ CORRECT - with cleanup
useEffect(() => {
  const subscription = someService.subscribe(handleUpdate);

  return () => {
    subscription.unsubscribe();
  };
}, []);

// ✗ WRONG - no cleanup
useEffect(() => {
  someService.subscribe(handleUpdate);
}, []);
```

### Timer Cleanup

```javascript
useEffect(() => {
  const timerId = setTimeout(() => doSomething(), 1000);
  const intervalId = setInterval(() => doSomething(), 5000);

  return () => {
    clearTimeout(timerId);
    clearInterval(intervalId);
  };
}, []);
```

### Async Operations with Abort

```javascript
useEffect(() => {
  const controller = new AbortController();

  const fetchData = async () => {
    try {
      const response = await fetch(url, {signal: controller.signal});
      const data = await response.json();
      setData(data);
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error(error);
      }
    }
  };

  fetchData();

  return () => controller.abort();
}, [url]);
```




---

## Security Best Practices



### Input Validation

```javascript
// Always validate and sanitize user input
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return '';
  return input.trim().replace(/<[^>]*>/g, ''); // Remove HTML tags
};

// Validate before using in queries
const isValidEventId = (id) => /^[a-zA-Z0-9_-]+$/.test(id);
```


### Secure Deep Linking

```javascript
// Always validate deep link parameters
const handleDeepLink = (url) => {
  const params = parseUrl(url);

  // Validate all parameters before use
  if (!isValidEventId(params.eventId)) {
    return;
  }

  navigateToEvent(params.eventId);
};
```

---





### Animations - Use Reanimated

```javascript
// Use react-native-reanimated for smooth animations
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

const offset = useSharedValue(0);

const animatedStyle = useAnimatedStyle(() => ({
  transform: [{translateX: offset.value}],
}));
```



---


### Use Project Logging Functions

```javascript
// Use existing logging utilities
import {log, warning} from '../Services/Utilities';

// For debug logs
log('Debug info:', data);

// For user-facing warnings
warning('Something went wrong');
```

---

## Testing Checklist

Before submitting changes, verify:

- [ ] No console warnings in development
- [ ] All useEffect hooks have cleanup functions
- [ ] No hardcoded sensitive values
- [ ] Works on both iOS and Android
- [ ] Memory usage stable (no leaks on mount/unmount cycles)
- [ ] Follows existing code patterns
- [ ] TypeScript types added for new data structures
- [ ] All UI text supports both English and Arabic
- [ ] Text is added to `strings.js` or `alertStrings.js` (no hardcoded strings)
- [ ] iOS screens have back button/header navigation
- [ ] Android hardware back button handled properly
- [ ] Navigation params are small and serializable (large data uses Redux/Context)
- [ ] Navigation animations configured (modal for create/edit, slide for details, fade for settings)
- [ ] Animations tested on real devices (not just emulator)
- [ ] Lists use FlatList (not ScrollView with .map())
- [ ] FlatList has `keyExtractor` with unique IDs (not index)
- [ ] List item components wrapped with React.memo
- [ ] Callbacks use useCallback to prevent re-renders
- [ ] Expensive calculations use useMemo
- [ ] Performance tested on low-end devices

---





---

## Common Pitfalls to Avoid

1. **Don't ignore Platform differences** - Always test on both iOS and Android
2. **Don't forget iOS back navigation** - iOS has no system back button, always add header navigation
3. **Don't pass large data via navigation params** - Use Redux/Context for objects, arrays, functions
4. **Don't ignore Android back button** - Handle hardware back press with BackHandler when needed
5. **Don't forget navigation animations** - Use modal for create/edit, slide for details, fade for settings
6. **Don't use slow animations** - Keep transitions under 300ms for snappy feel
7. **Don't use ScrollView for long lists** - Use FlatList with proper optimization (removeClippedSubviews, etc.)
8. **Don't use array index as FlatList key** - Always use unique IDs for keyExtractor
9. **Don't skip React.memo on list items** - Wrap FlatList renderItem components with React.memo
10. **Don't create functions/objects in render** - Use useCallback/useMemo to prevent re-renders
11. **Don't mutate state directly** - Always use setState or dispatch
12. **Don't forget to handle loading and error states** - Users need feedback
13. **Don't ignore keyboard handling** - Use KeyboardAvoidingView
14. **Don't hardcode dimensions** - Use Dimensions API or responsive values
15. **Don't skip accessibility** - Add accessibilityLabel to interactive elements

---

## When Making Changes

1. **Read existing code first** - Understand patterns before modifying
2. **Keep changes minimal** - Only change what's necessary
3. **Follow existing structure** - Match the style of surrounding code
4. **Test on both platforms** - iOS and Android behave differently
5. **Check for memory leaks** - Verify cleanup on unmount
6. **Update types if needed** - Keep TypeScript definitions current
7. **Keep code clean**

---