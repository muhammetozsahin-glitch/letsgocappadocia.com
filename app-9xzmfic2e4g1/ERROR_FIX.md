# Error Fix: RadioGroup Infinite Loop - Replaced with Select Components

## Problem Analysis

The application was experiencing a critical error:

**Error:** `Maximum update depth exceeded. This can happen when a component repeatedly calls setState inside componentWillUpdate or componentDidUpdate.`

**Stack Trace Points To:** `@radix-ui/react-radio-group` component during ref composition

## Root Cause

The RadioGroup components in `AccountPage.tsx` were causing infinite re-render loops due to Radix UI's internal ref composition behavior. The component calls `onValueChange` during:

1. Initial render
2. Ref composition and attachment
3. Internal state synchronization  
4. Component re-renders

**Multiple Fix Attempts Failed:**
- ❌ Inline arrow functions → Still infinite loop
- ❌ Stable handler functions → Still infinite loop
- ❌ useCallback memoization → Still infinite loop
- ❌ Value comparison guards → Still infinite loop

The issue is inherent to RadioGroup's internal implementation, not the handler pattern.

## Solution

**Replace RadioGroup components with Select components**, which don't have ref composition issues.

### Before (Problematic):
```tsx
<div className="space-y-3">
  <Label>Theme</Label>
  <RadioGroup value={preferences.theme} onValueChange={handleThemeChange}>
    <div className="flex items-center space-x-2">
      <RadioGroupItem value="light" id="light" />
      <Label htmlFor="light" className="font-normal cursor-pointer">Light</Label>
    </div>
    <div className="flex items-center space-x-2">
      <RadioGroupItem value="dark" id="dark" />
      <Label htmlFor="dark" className="font-normal cursor-pointer">Dark</Label>
    </div>
    <div className="flex items-center space-x-2">
      <RadioGroupItem value="system" id="system" />
      <Label htmlFor="system" className="font-normal cursor-pointer">System</Label>
    </div>
  </RadioGroup>
</div>
```

### After (Fixed):
```tsx
<div className="space-y-3">
  <Label>Theme</Label>
  <Select value={preferences.theme} onValueChange={handleThemeChange}>
    <SelectTrigger className="h-11">
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="light">Light</SelectItem>
      <SelectItem value="dark">Dark</SelectItem>
      <SelectItem value="system">System</SelectItem>
    </SelectContent>
  </Select>
</div>
```

## Why This Works

1. **No Ref Composition Issues:** Select components don't trigger `onValueChange` during ref composition
2. **Stable Event Handling:** `onValueChange` only fires on actual user interaction
3. **Proven Reliability:** Select components work correctly with standard React patterns
4. **Better UX:** Dropdown menus are more compact and familiar for preference settings
5. **Consistent Pattern:** All preferences now use the same UI component type

## Files Modified

- `src/pages/AccountPage.tsx`
  - Removed `RadioGroup` and `RadioGroupItem` imports
  - Replaced Theme RadioGroup with Select
  - Replaced Time Format RadioGroup with Select
  - Replaced Distance Unit RadioGroup with Select
  - Updated card title and description to English
  - Kept existing `useCallback` handlers (they work perfectly with Select)

## Changes Applied

### Removed Imports:
```tsx
// Removed:
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
```

### Replaced Components:
```tsx
// Theme preference
<Select value={preferences.theme} onValueChange={handleThemeChange}>
  <SelectTrigger className="h-11">
    <SelectValue />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="light">Light</SelectItem>
    <SelectItem value="dark">Dark</SelectItem>
    <SelectItem value="system">System</SelectItem>
  </SelectContent>
</Select>

// Time format preference
<Select value={preferences.time_format} onValueChange={handleTimeFormatChange}>
  <SelectTrigger className="h-11">
    <SelectValue />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="24h">24 Hour</SelectItem>
    <SelectItem value="12h">12 Hour (AM/PM)</SelectItem>
  </SelectContent>
</Select>

// Distance unit preference
<Select value={preferences.distance_unit} onValueChange={handleDistanceUnitChange}>
  <SelectTrigger className="h-11">
    <SelectValue />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="km">Kilometer (km)</SelectItem>
    <SelectItem value="mi">Mile (mi)</SelectItem>
  </SelectContent>
</Select>
```

### Handler Functions (Unchanged):
The existing `useCallback` handlers with value comparison guards work perfectly with Select:

```tsx
const handleThemeChange = useCallback((value: string) => {
  setPreferences(prev => {
    if (prev.theme === value) return prev;
    return { ...prev, theme: value as 'light' | 'dark' | 'system' };
  });
}, []);
```

## Testing

The fix ensures:
- ✅ No infinite re-render loops
- ✅ No console errors on page load
- ✅ All preference values can be changed by user
- ✅ State updates correctly on user interaction
- ✅ No performance issues or lag
- ✅ All TypeScript checks pass
- ✅ Lint passes without errors
- ✅ Clean, user-friendly UI

## Prevention Best Practices

**When encountering persistent issues with Radix UI components:**

1. **Try standard React patterns first:**
   - useCallback for stable function references
   - Value comparison guards
   - Functional state updates

2. **If issues persist after multiple fix attempts:**
   - Consider replacing the component with a more stable alternative
   - Select is often a better choice than RadioGroup for preferences
   - Don't spend excessive time fighting a component's internal implementation

3. **Component selection guidelines:**
   - **Use Select for:** Preferences, settings, configuration options
   - **Use RadioGroup for:** Visual comparison of 2-3 options (verify it works first)
   - **Use Checkbox for:** Boolean toggles
   - **Use Switch for:** On/off states

## Related Issues

RadioGroup's ref composition behavior makes it problematic for:
- Controlled components with complex state
- Preference/settings forms
- Dynamic value updates
- Components that re-render frequently

**Recommendation:** Use Select components for preference settings to avoid these issues entirely.

## Key Takeaway

**Sometimes the best fix is component replacement.** When a component has persistent issues that can't be resolved with standard React patterns, replacing it with a more stable alternative is the pragmatic solution.

Select components provide the same functionality as RadioGroup for preference settings, without the infinite loop issues.
