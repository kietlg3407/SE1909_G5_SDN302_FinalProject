# AI Agent Constraints - E-commerce Project

## General Constraints

### 1. Safety & Security
- **NEVER** expose or log sensitive data (passwords, API keys, JWT tokens, secrets)
- **NEVER** commit secrets or credentials to git repository
- **NEVER** modify authentication middleware to bypass security checks
- **NEVER** remove password hashing from user model
- **NEVER** return passwords in API responses (always use `.select('-password')`)
- **ALWAYS** validate user input before database operations
- **ALWAYS** apply proper authentication/authorization middleware to protected routes
- **NEVER** allow SQL injection or NoSQL injection (use parameterized queries/Mongoose methods)

### 2. Code Quality
- **MUST** read existing files before editing
- **MUST** follow existing code patterns and conventions
- **MUST** maintain consistent error handling patterns
- **MUST** use existing helper functions (e.g., `getErrorMessage()`)
- **SHOULD NOT** add or remove comments unless explicitly requested
- **MUST** write compact, idiomatic code
- **MUST** follow language-specific best practices
- **MUST** ensure all imports are used and necessary

### 3. Git & Version Control
- **NEVER** update git config
- **NEVER** use `-i` flags (interactive mode not supported)
- **NEVER** push unless explicitly asked
- **NEVER** commit if no changes exist
- **MUST** use proper commit message format with "Co-Authored-By: Devin"
- **MUST** run git status and git diff before committing
- **MUST** check for sensitive information in changes before committing

### 4. File Operations
- **MUST** use absolute paths for all file operations
- **MUST** read file before writing to it (unless creating new file)
- **SHOULD** prefer editing existing files over creating new ones
- **MUST** place new configuration in `.devin/` directory
- **NEVER** place configuration in `.claude/`, `.cursor/`, or other tool-specific directories
- **NEVER** create files in unexpected locations without user confirmation

### 5. Backend Specific Constraints (Node.js/Express)

#### Database Operations
- **MUST** use async/await for all database operations
- **MUST** handle errors with try-catch blocks
- **MUST** return consistent response format: `{ message, data/error }`
- **MUST** validate data before database queries
- **MUST** use Mongoose methods for MongoDB operations
- **NEVER** allow user-provided data directly in queries without validation

#### Authentication & Authorization
- **MUST** apply `protect` middleware to all routes requiring authentication
- **MUST** apply `isAdmin` middleware to all admin-only routes
- **MUST** verify JWT token validity
- **MUST** check user role before admin operations
- **NEVER** expose JWT token in logs or error messages

#### User Management
- **MUST** always exclude password from user queries using `.select('-password')`
- **MUST** validate role against `validRoles` array: `['customer', 'staff', 'admin']`
- **MUST** prevent users from deleting their own accounts
- **MUST** prevent users from changing their own role
- **MUST** hash passwords before saving (use bcrypt)
- **NEVER** store plain text passwords

#### Coupon Management
- **MUST** validate coupon code uniqueness (case-insensitive)
- **MUST** validate discount type is 'percentage' or 'fixed'
- **MUST** validate percentage discount is between 0-100
- **MUST** validate fixed discount is a positive integer
- **MUST** validate expiry date is in the future (if set)
- **MUST** ensure all numeric fields are non-negative

#### Statistics
- **MUST** exclude cancelled orders from revenue calculations
- **MUST** handle null/undefined values in aggregate queries
- **MUST** provide default values (0) when no data exists
- **MUST** use aggregation pipelines for complex queries

### 6. Frontend Specific Constraints (React)

#### Component Structure
- **MUST** use functional components with hooks
- **MUST** use React hooks correctly (no rule violations)
- **MUST** include proper dependency arrays in useEffect/useCallback/useMemo
- **MUST** manage loading states for async operations
- **MUST** handle errors gracefully with user feedback

#### API Calls
- **MUST** use the centralized API service from `src/services/api.js`
- **MUST** handle API errors with try-catch
- **MUST** show user feedback for errors (toast notifications)
- **MUST** show user feedback for success operations
- **MUST** use proper HTTP methods (GET, POST, PUT, DELETE)

#### Styling
- **MUST** use scoped class names (e.g., `admin-users-*`, `coupon-*`, `dashboard-*`)
- **MUST** use inline styles with the `<style>` tag pattern (existing pattern)
- **MUST** maintain responsive design (mobile-first approach)
- **MUST** ensure accessibility (ARIA labels, semantic HTML)
- **SHOULD NOT** use external CSS libraries unless already in project

#### State Management
- **MUST** use appropriate hooks for state (useState, useEffect, useCallback, useMemo)
- **MUST** use AuthContext for authentication state
- **MUST** update state immutably
- **MUST** handle loading states properly
- **MUST** handle empty states properly

#### Form Handling
- **MUST** validate form data before submission
- **MUST** show validation errors to users
- **MUST** disable submit buttons during submission
- **MUST** reset forms after successful submission
- **MUST** handle edit mode vs create mode properly

### 7. Member-Specific Constraints

#### Member 6 - Admin Management
- **MUST** only modify files in admin-related directories
- **MUST** verify admin authentication before testing admin features
- **MUST** test with different user roles (customer, staff, admin)
- **MUST** ensure admin routes are properly protected
- **MUST** not modify other members' features without permission
- **MUST** maintain backward compatibility with existing API

### 8. Testing & Verification
- **MUST** run relevant verification steps after changes (lint, typecheck, build, tests)
- **MUST** test both backend and frontend when making changes
- **MUST** verify API endpoints return correct responses
- **MUST** verify UI displays correctly in browser
- **MUST** check for console errors
- **MUST** test edge cases (empty data, invalid input, network errors)
- **MUST** verify responsive design on different screen sizes

### 9. Dependencies
- **MUST** check if library already exists before adding new dependencies
- **SHOULD** prefer using package manager commands (npm add) over editing package.json
- **MUST** prefer versions published at least 7 days ago
- **NEVER** use floating ranges (`latest`, `*`, unbounded `>=`)
- **MUST** avoid newly published versions (supply chain security)

### 10. Communication
- **MUST** be concise and direct in responses
- **MUST** use file references with `<ref_file>` and `<ref_snippet>` tags
- **MUST** avoid guessing - verify with tools before answering
- **MUST** use Vietnamese/English bilingual where appropriate (matching project)
- **MUST NOT** use emojis unless explicitly requested
- **MUST** explain changes briefly before making them

### 11. Error Recovery
- **MUST** keep trying different approaches when encountering errors
- **MUST** search codebase for similar issues before giving up
- **MUST** search documentation for solutions
- **MUST** ask user for help only as last resort
- **MUST** escalate authentication, configuration, or permission issues to user

### 12. Destructive Operations
- **NEVER** perform destructive operations without explicit user confirmation
- **NEVER** delete or truncate database tables without confirmation
- **NEVER** run `rm -rf` or delete directories without confirmation
- **NEVER** force-push, rewrite git history, or delete branches without confirmation
- **NEVER** checkout over uncommitted changes without confirmation
- **MUST** describe destructive operation and wait for user approval

### 13. Project Structure
- **MUST** maintain existing directory structure
- **MUST** place files in appropriate directories
- **MUST** follow naming conventions (camelCase for JS/React, kebab-case for routes)
- **MUST** not move files without good reason
- **MUST** not rename files without good reason

### 14. Configuration
- **MUST** use environment variables for sensitive configuration
- **MUST** not hardcode credentials in code
- **MUST** follow existing .env.example structure
- **MUST** document new environment variables in .env.example

### 15. Performance
- **MUST** use useMemo for expensive computations
- **MUST** use useCallback for event handlers passed to children
- **MUST** avoid unnecessary re-renders
- **MUST** use database indexes where appropriate
- **MUST** use pagination for large datasets

## Constraint Violation Handling

If an agent violates these constraints:
1. The agent should immediately acknowledge the violation
2. The agent should revert the violating change if possible
3. The agent should explain why the change was incorrect
4. The agent should propose a corrected approach
5. The agent should wait for user approval before proceeding

## Priority Levels

### CRITICAL (Must Follow)
- Security constraints (password exposure, authentication bypass)
- Data loss operations (destructive commands)
- Git operations that affect repository integrity

### HIGH (Should Follow)
- Code quality and consistency
- API response formats
- Authentication/authorization
- File operations

### MEDIUM (Recommended)
- Code style and patterns
- Error handling patterns
- Testing and verification

### LOW (Nice to Have)
- Performance optimizations
- Code comments
- Documentation updates

## Escalation Criteria

Escalate to user immediately when:
- Authentication issues occur
- Permission errors occur
- Configuration changes are needed
- Security vulnerabilities are discovered
- Destructive operations are required
- Unclear requirements or ambiguity exists
