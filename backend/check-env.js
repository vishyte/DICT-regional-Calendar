console.log('Environment Variables:');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');
console.log('DATABASE_HOST:', process.env.DATABASE_HOST);
console.log('DATABASE_PORT:', process.env.DATABASE_PORT);
console.log('DATABASE_NAME:', process.env.DATABASE_NAME);
console.log('DATABASE_USER:', process.env.DATABASE_USER);
console.log('DATABASE_PASSWORD:', process.env.DATABASE_PASSWORD ? 'SET' : 'NOT SET');
console.log('\nAll vars with postgres/database:');
Object.keys(process.env).forEach(key => {
  if (key.toLowerCase().includes('postgres') || key.toLowerCase().includes('database')) {
    console.log(`${key}: ${key.includes('PASSWORD') ? '***' : process.env[key]}`);
  }
});
