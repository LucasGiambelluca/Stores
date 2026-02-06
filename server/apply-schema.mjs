// Quick script to apply schema changes
import { execSync } from 'child_process';

console.log('Applying database schema changes...');

try {
  // Run drizzle-kit push with auto-accept
  execSync('pnpm exec drizzle-kit push --yes', {
    cwd: 'C:\\Users\\Lucas\\Desktop\\tiendita\\server',
    stdio: 'inherit'
  });
  console.log('✅ Schema updated successfully!');
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
