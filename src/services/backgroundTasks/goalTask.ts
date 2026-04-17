/**
 * Purpose: Check goals on app open to see if any have been reached
 * 
 * Strategy:
 *   - On app open, check all active goals
 *   - Compare currentAmount with targetAmount
 *   - Mark goals as completed if target reached
 *   - Return list of newly completed goals
 */

import { GoalRepository } from '../../database/repositories/GoalRepository';
import type { Goal } from '../../types/models';

/**
 * Purpose: Check if a goal has been reached
 * 
 * Inputs:
 *   - goal (Goal): The goal to check
 * 
 * Outputs:
 *   - Returns (boolean): true if goal reached, false otherwise
 * 
 * Side effects: None
 */
function isGoalReached(goal: Goal): boolean {
  if (goal.targetAmount === null) return false;
  return goal.currentAmount >= goal.targetAmount && !goal.isCompleted;
}

/**
 * Purpose: Check all goals and mark completed ones
 * 
 * Outputs:
 *   - Returns (Promise<{completed: Goal[]}>): List of newly completed goals
 * 
 * Side effects:
 *   - Updates isCompleted flag for reached goals
 *   - Sets completedAt timestamp
 */
export async function checkAndCompleteGoals(accountId: string): Promise<{ 
  completed: Goal[];
}> {
  console.log('[GoalTask] Checking goals on app open...');
  
  const goalRepo = new GoalRepository();
  const completedGoals: Goal[] = [];
  
  try {
    // Get all goals for account
    const allGoals = await goalRepo.findByAccount(accountId);
    
    // Filter active (not completed) goals
    const activeGoals = allGoals.filter((g: Goal) => !g.isCompleted);
    
    console.log(`[GoalTask] Checking ${activeGoals.length} active goals`);
    
    for (const goal of activeGoals) {
      if (isGoalReached(goal)) {
        try {
          console.log(`[GoalTask] Goal reached: ${goal.name} (${goal.currentAmount}/${goal.targetAmount})`);
          
          // Mark goal as completed
          await goalRepo.markCompleted(goal.id);
          
          // Add to completed list
          completedGoals.push({
            ...goal,
            isCompleted: true,
            completedAt: Date.now(),
          });
          
        } catch (error) {
          console.error(`[GoalTask] Failed to complete goal ${goal.name}:`, error);
        }
      }
    }
    
    if (completedGoals.length > 0) {
      console.log(`[GoalTask] ${completedGoals.length} goal(s) completed!`);
    }
    
    return { completed: completedGoals };
  } catch (error) {
    console.error('[GoalTask] Error checking goals:', error);
    return { completed: [] };
  }
}

/**
 * Purpose: Get progress percentage for a goal
 * 
 * Inputs:
 *   - currentAmount (number): Current saved amount
 *   - targetAmount (number): Target amount
 * 
 * Outputs:
 *   - Returns (number): Progress percentage (0-100)
 * 
 * Side effects: None
 */
export function getGoalProgress(currentAmount: number, targetAmount: number): number {
  if (targetAmount === 0) return 0;
  return Math.min(100, Math.round((currentAmount / targetAmount) * 100));
}

/**
 * Purpose: Calculate amount remaining to reach goal
 * 
 * Inputs:
 *   - currentAmount (number): Current saved amount
 *   - targetAmount (number): Target amount
 * 
 * Outputs:
 *   - Returns (number): Amount remaining (0 if goal reached)
 * 
 * Side effects: None
 */
export function getAmountRemaining(currentAmount: number, targetAmount: number): number {
  return Math.max(0, targetAmount - currentAmount);
}
