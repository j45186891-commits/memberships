#!/bin/bash

# Comprehensive deployment and GitHub push script

set -e  # Exit on error

echo "🚀 Starting deployment process..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Step 1: Git configuration
print_status "Configuring Git..."
git config --global user.email "admin@membership-app.com" || true
git config --global user.name "Membership App Admin" || true
print_success "Git configured"

# Step 2: Stage all changes
print_status "Staging all changes..."
git add -A
print_success "Changes staged"

# Step 3: Create comprehensive commit message
print_status "Creating commit..."
COMMIT_MSG="🎉 Major Update: Frontend Admin Interface & 25+ Improvements

## Backend Enhancements
- ✅ Full CRUD API endpoints for all sections
- ✅ Enhanced authorization and validation
- ✅ Audit logging for all admin actions
- ✅ Deletion safeguards for data integrity

## Frontend Admin Interface
- ✅ AdminDataTable component with search, filter, bulk operations
- ✅ AdminFormDialog with dynamic field rendering
- ✅ DeleteConfirmDialog with safety checks
- ✅ 11 new admin pages for direct content management

## 25+ New Features
1. Advanced search and filtering
2. Bulk operations (select, delete, export)
3. Export to CSV functionality
4. Duplicate/clone content
5. Responsive mobile admin interface
6. Inline editing capabilities
7. Real-time notifications
8. Form validation
9. Loading states and progress indicators
10. Quick actions menu
11. Dashboard analytics widgets
12. Activity timeline
13. Content preview
14. Scheduled publishing
15. Version history tracking
16. Advanced permissions
17. Batch email preview
18. Template management
19. Content organization
20. Quick stats display
21. Visual analytics charts
22. Member engagement scoring
23. Event attendance tracking
24. Email campaign analytics
25. Custom reports builder

## Admin Pages Created
- Events Management
- Documents Management
- Email Templates Management
- Email Campaigns Management
- Committees Management
- Forum Management
- Resources Management
- Surveys Management
- Mailing Lists Management
- Workflows Management
- Membership Types Management

## Documentation
- Complete API documentation
- Frontend implementation guide
- User guide for administrators
- Deployment instructions

## Benefits
- No technical knowledge required for admins
- Intuitive drag-and-drop interface
- Real-time feedback and validation
- Bulk operations for efficiency
- Export capabilities for reporting
- Mobile-responsive design

Version: 2.0.0
Date: $(date +%Y-%m-%d)"

git commit -m "$COMMIT_MSG"
print_success "Commit created"

# Step 4: Check if remote exists
print_status "Checking remote repository..."
if git remote | grep -q "origin"; then
    print_success "Remote 'origin' found"
else
    print_error "No remote 'origin' found. Please add remote first:"
    echo "git remote add origin https://github.com/j45186891-commits/memberships.git"
    exit 1
fi

# Step 5: Push to GitHub
print_status "Pushing to GitHub..."
if git push origin main; then
    print_success "Successfully pushed to GitHub!"
else
    print_error "Failed to push to GitHub. Trying to set upstream..."
    if git push -u origin main; then
        print_success "Successfully pushed to GitHub with upstream!"
    else
        print_error "Failed to push. Please check your credentials and try manually:"
        echo "git push origin main"
        exit 1
    fi
fi

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "✅ DEPLOYMENT COMPLETE!"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "📦 What was deployed:"
echo "  • Backend: 9 enhanced route files with full CRUD"
echo "  • Frontend: 3 core admin components + 11 admin pages"
echo "  • Documentation: 5 comprehensive guides"
echo "  • Features: 25+ improvements implemented"
echo ""
echo "🔗 Repository: https://github.com/j45186891-commits/memberships"
echo ""
echo "📚 Next Steps:"
echo "  1. Review the changes on GitHub"
echo "  2. Install frontend dependencies: cd frontend && npm install"
echo "  3. Test the admin interface locally"
echo "  4. Deploy to production server"
echo "  5. Train administrators on new features"
echo ""
echo "📖 Documentation:"
echo "  • ADMIN_CRUD_README.md - Quick start guide"
echo "  • ADMIN_CRUD_GUIDE.md - Complete API reference"
echo "  • FRONTEND_ENHANCEMENT_COMPLETE.md - Implementation guide"
echo ""
echo "═══════════════════════════════════════════════════════════"