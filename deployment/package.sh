#!/bin/bash

# Package the Membership Management System for distribution

echo "=========================================="
echo "Packaging Membership Management System"
echo "=========================================="
echo ""

# Create package directory
PACKAGE_DIR="membership-app-v1.0.0"
mkdir -p $PACKAGE_DIR

# Copy application files
echo "Copying application files..."
cp -r backend $PACKAGE_DIR/
cp -r frontend $PACKAGE_DIR/
cp -r database $PACKAGE_DIR/
cp -r deployment $PACKAGE_DIR/
cp -r docs $PACKAGE_DIR/

# Copy root files
cp package.json $PACKAGE_DIR/
cp README.md $PACKAGE_DIR/
cp PROJECT_SUMMARY.md $PACKAGE_DIR/
cp todo.md $PACKAGE_DIR/

# Create LICENSE file
cat > $PACKAGE_DIR/LICENSE << 'EOF'
MIT License

Copyright (c) 2025 NinjaTech AI

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
EOF

# Remove node_modules if present
echo "Cleaning up..."
rm -rf $PACKAGE_DIR/backend/node_modules
rm -rf $PACKAGE_DIR/frontend/node_modules

# Create archive
echo "Creating archive..."
tar -czf membership-app-v1.0.0.tar.gz $PACKAGE_DIR

# Create zip for Windows users
zip -r membership-app-v1.0.0.zip $PACKAGE_DIR

# Cleanup
rm -rf $PACKAGE_DIR

echo ""
echo "=========================================="
echo "Packaging Complete!"
echo "=========================================="
echo ""
echo "Created files:"
echo "  - membership-app-v1.0.0.tar.gz"
echo "  - membership-app-v1.0.0.zip"
echo ""
echo "Distribution packages are ready!"