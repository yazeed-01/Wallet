#!/bin/bash
# filepath: generate-structure.sh

OUTPUT_FILE="PROJECT_STRUCTURE.md"

echo "# Crowd React Native - Project Structure" > $OUTPUT_FILE
echo "" >> $OUTPUT_FILE
echo "**Generated:** $(date)" >> $OUTPUT_FILE
echo "**Framework:** React Native 0.79.0 with Expo SDK 53" >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE

# Project Overview
echo "## Project Overview" >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE
echo "- **Language:** JavaScript (components) + TypeScript (data structures, services)" >> $OUTPUT_FILE
echo "- **State Management:** Redux Toolkit + React Context API" >> $OUTPUT_FILE
echo "- **Navigation:** React Navigation v6" >> $OUTPUT_FILE
echo "- **Backend:** Firebase (Auth, Database, Messaging)" >> $OUTPUT_FILE
echo "- **Video Processing:** FFmpeg, expo-av, Vision Camera, VLC" >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE

# File Statistics
echo "## File Statistics" >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE
echo '```' >> $OUTPUT_FILE
echo "Total JavaScript files: $(find . -name "*.js" -not -path "*/node_modules/*" -not -path "*/.expo/*" -not -path "*/android/*" -not -path "*/ios/*" | wc -l)" >> $OUTPUT_FILE
echo "Total TypeScript files: $(find . -name "*.ts" -o -name "*.tsx" -not -path "*/node_modules/*" -not -path "*/.expo/*" | wc -l)" >> $OUTPUT_FILE
echo "Total Components: $(find ./Components -name "*.js" 2>/dev/null | wc -l)" >> $OUTPUT_FILE
echo "Total Screens: $(find ./Screens -name "*.js" 2>/dev/null | wc -l)" >> $OUTPUT_FILE
echo "Total Services: $(find ./Services -name "*.js" -o -name "*.ts" 2>/dev/null | wc -l)" >> $OUTPUT_FILE
echo "Total Hooks: $(find ./hooks -name "*.js" 2>/dev/null | wc -l)" >> $OUTPUT_FILE
echo '```' >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE

# Main Directory Structure
echo "## Main Directory Structure" >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE
echo '```' >> $OUTPUT_FILE
if command -v tree &> /dev/null; then
    tree -L 2 -I 'node_modules|.git|.expo|build|dist|coverage|android|ios|.vscode|__tests__|Pods' --dirsfirst >> $OUTPUT_FILE
else
    find . -maxdepth 2 -type d -not -path "*/node_modules/*" -not -path "*/.git/*" -not -path "*/.expo/*" -not -path "*/android/*" -not -path "*/ios/*" | sed 's|^\./||' | sort >> $OUTPUT_FILE
fi
echo '```' >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE

# Key Directories with Descriptions
echo "## Key Directories" >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE
echo "### Core Application" >> $OUTPUT_FILE
echo "- **src/screens/**: Feature screens (Dashboard, Transactions, Goals, Vault, etc.)" >> $OUTPUT_FILE
echo "  - Each screen handles specific user flows" >> $OUTPUT_FILE
echo "  - Contains both JavaScript and React Native components" >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE
echo "- **src/components/**: Reusable UI components" >> $OUTPUT_FILE
echo "  - Organized by feature area (transactions, goals, debts, vault)" >> $OUTPUT_FILE
echo "  - Common components shared across features" >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE
echo "- **src/services/**: Business logic, API calls, utilities" >> $OUTPUT_FILE
echo "  - TypeScript for type safety" >> $OUTPUT_FILE
echo "  - Currency service, widget management" >> $OUTPUT_FILE
echo "  - Background tasks, biometric auth, haptics" >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE

echo "### State & Navigation" >> $OUTPUT_FILE
echo "- **src/hooks/**: Custom React hooks" >> $OUTPUT_FILE
echo "  - Naming convention: \`use[HookName].ts\`" >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE
echo "- **src/contexts/**: React Context providers" >> $OUTPUT_FILE
echo "  - Global state management (ThemeContext, etc.)" >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE
echo "- **src/navigation/**: Navigation configuration" >> $OUTPUT_FILE
echo "  - React Navigation v6 setup" >> $OUTPUT_FILE
echo "  - Auth, Main, and Root navigators" >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE
echo "- **src/store/**: Redux Toolkit store and slices" >> $OUTPUT_FILE
echo "  - Global app state (accounts, auth, settings, vault)" >> $OUTPUT_FILE
echo "  - Feature-based stores" >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE

echo "### Data & Configuration" >> $OUTPUT_FILE
echo "- **src/types/**: TypeScript types, interfaces, models" >> $OUTPUT_FILE
echo "  - Type definitions for data models" >> $OUTPUT_FILE
echo "  - Shared interfaces across the app" >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE
echo "- **src/constants/**: App-wide constants" >> $OUTPUT_FILE
echo "  - Currency definitions" >> $OUTPUT_FILE
echo "  - Configuration values" >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE
echo "- **src/utils/**: Utility functions" >> $OUTPUT_FILE
echo "  - Helper functions (calculator, validators, etc.)" >> $OUTPUT_FILE
echo "  - Common operations" >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE
echo "- **src/database/**: Database layer" >> $OUTPUT_FILE
echo "  - Schema definitions" >> $OUTPUT_FILE
echo "  - Queries and repositories" >> $OUTPUT_FILE
echo "  - Migration scripts" >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE

echo "### Styling" >> $OUTPUT_FILE
echo "- **src/theme/**: Theme configuration" >> $OUTPUT_FILE
echo "  - Colors, typography, spacing" >> $OUTPUT_FILE
echo "  - Animations and shared styles" >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE

# Detailed File Listing
echo "## Detailed Structure" >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE

# Screens
if [ -d "./src/screens" ]; then
    echo "### src/screens/" >> $OUTPUT_FILE
    echo '```' >> $OUTPUT_FILE
    find ./src/screens -type f \( -name "*.ts" -o -name "*.tsx" \) | sed 's|^\./src/screens/||' | sort >> $OUTPUT_FILE
    echo '```' >> $OUTPUT_FILE
    echo "" >> $OUTPUT_FILE
fi

# Components
if [ -d "./src/components" ]; then
    echo "### src/components/" >> $OUTPUT_FILE
    echo '```' >> $OUTPUT_FILE
    find ./src/components -type f \( -name "*.ts" -o -name "*.tsx" \) | sed 's|^\./src/components/||' | head -50 >> $OUTPUT_FILE
    component_count=$(find ./src/components -type f \( -name "*.ts" -o -name "*.tsx" \) | wc -l)
    if [ "$component_count" -gt 50 ]; then
        echo "... (showing first 50 of $component_count files)" >> $OUTPUT_FILE
    fi
    echo '```' >> $OUTPUT_FILE
    echo "" >> $OUTPUT_FILE
fi

# Services
if [ -d "./src/services" ]; then
    echo "### src/services/" >> $OUTPUT_FILE
    echo '```' >> $OUTPUT_FILE
    find ./src/services -type f \( -name "*.ts" -o -name "*.tsx" \) | sed 's|^\./src/services/||' | sort >> $OUTPUT_FILE
    echo '```' >> $OUTPUT_FILE
    echo "" >> $OUTPUT_FILE
fi

# Store
if [ -d "./src/store" ]; then
    echo "### src/store/" >> $OUTPUT_FILE
    echo '```' >> $OUTPUT_FILE
    find ./src/store -type f \( -name "*.ts" -o -name "*.tsx" \) | sed 's|^\./src/store/||' | sort >> $OUTPUT_FILE
    echo '```' >> $OUTPUT_FILE
    echo "" >> $OUTPUT_FILE
fi

# Types
if [ -d "./src/types" ]; then
    echo "### src/types/" >> $OUTPUT_FILE
    echo '```' >> $OUTPUT_FILE
    find ./src/types -type f \( -name "*.ts" -o -name "*.tsx" \) | sed 's|^\./src/types/||' | sort >> $OUTPUT_FILE
    echo '```' >> $OUTPUT_FILE
    echo "" >> $OUTPUT_FILE
fi

# Hooks
if [ -d "./src/hooks" ]; then
    echo "### src/hooks/" >> $OUTPUT_FILE
    echo '```' >> $OUTPUT_FILE
    find ./src/hooks -type f \( -name "*.ts" -o -name "*.tsx" \) | sed 's|^\./src/hooks/||' | sort >> $OUTPUT_FILE
    echo '```' >> $OUTPUT_FILE
    echo "" >> $OUTPUT_FILE
fi

# Database
if [ -d "./src/database" ]; then
    echo "### src/database/" >> $OUTPUT_FILE
    echo '```' >> $OUTPUT_FILE
    find ./src/database -type f \( -name "*.ts" -o -name "*.tsx" \) | sed 's|^\./src/database/||' | sort >> $OUTPUT_FILE
    echo '```' >> $OUTPUT_FILE
    echo "" >> $OUTPUT_FILE
fi

# Important Files
echo "## Important Configuration Files" >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE
echo '```' >> $OUTPUT_FILE
ls -1 *.json *.js *.ts *.config.js 2>/dev/null | grep -v node_modules >> $OUTPUT_FILE
echo '```' >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE

# Code Conventions Summary
echo "## Code Conventions" >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE
echo "### Naming Conventions" >> $OUTPUT_FILE
echo "- **Components/Screens**: PascalCase (e.g., \`TransactionList.tsx\`)" >> $OUTPUT_FILE
echo "- **Hooks**: use prefix (e.g., \`useThemeColors.ts\`)" >> $OUTPUT_FILE
echo "- **Functions/Variables**: camelCase (e.g., \`handlePress\`)" >> $OUTPUT_FILE
echo "- **Constants**: UPPER_SNAKE_CASE (e.g., \`MAX_AMOUNT\`)" >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE

echo "### Performance Rules" >> $OUTPUT_FILE
echo "- ✓ Always use **FlatList** for lists (never ScrollView with .map())" >> $OUTPUT_FILE
echo "- ✓ Use **React.memo** on list item components" >> $OUTPUT_FILE
echo "- ✓ Use **useCallback** for functions passed to children" >> $OUTPUT_FILE
echo "- ✓ Use **useMemo** for expensive calculations" >> $OUTPUT_FILE
echo "- ✓ Set \`removeClippedSubviews={true}\` on FlatLists" >> $OUTPUT_FILE
echo "- ✓ Clean up useEffect hooks (subscriptions, timers)" >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE

echo "### State Management" >> $OUTPUT_FILE
echo "- Use **Redux Toolkit** for global state (accounts, auth, settings)" >> $OUTPUT_FILE
echo "- Use **React Context** for theme and UI state" >> $OUTPUT_FILE
echo "- Keep component state local when possible" >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE

echo "### Navigation" >> $OUTPUT_FILE
echo "- Pass small data via route params (IDs, flags)" >> $OUTPUT_FILE
echo "- Pass large data via Redux/Context" >> $OUTPUT_FILE
echo "- Always add back button for iOS screens" >> $OUTPUT_FILE
echo "- Handle Android hardware back button with BackHandler" >> $OUTPUT_FILE
echo "- Use modal animation for create/edit screens" >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE

# Footer
echo "---" >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE
echo "**Note**: This structure file helps LLM models understand the codebase without reading all files." >> $OUTPUT_FILE
echo "Update this file when adding new major features or restructuring directories." >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE
echo "**Regenerate**: \`bash generate-structure.sh\` or \`npm run structure\`" >> $OUTPUT_FILE

echo "✓ Project structure saved to $OUTPUT_FILE"
