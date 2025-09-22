const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createAdminUserViaAPI() {
  try {
    // First, let's create a role if it doesn't exist
    let adminRole = await prisma.role.findFirst({
      where: { name: 'admin' }
    });

    if (!adminRole) {
      adminRole = await prisma.role.create({
        data: {
          name: 'admin',
          value: 'admin'
        }
      });
      console.log('✅ Admin role created');
    } else {
      console.log('✅ Admin role already exists');
    }

    // Create a branch if it doesn't exist
    let branch = await prisma.branch.findFirst({
      where: { name: 'Main Branch' }
    });

    if (!branch) {
      branch = await prisma.branch.create({
        data: {
          name: 'Main Branch',
          email: 'admin@kanza.com',
          phone: '1234567890'
        }
      });
      console.log('✅ Main branch created');
    } else {
      console.log('✅ Main branch already exists');
    }

    // Delete existing admin user if it exists
    await prisma.user.deleteMany({
      where: { email: 'admin@kanza.com' }
    });
    await prisma.account.deleteMany({
      where: { accountId: 'admin@kanza.com' }
    });

    console.log('✅ Cleaned up existing admin user');

    // Use the proper API endpoint to create the user
    const response = await fetch('http://localhost:3000/api/auth/create-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Admin User',
        email: 'admin@kanza.com',
        password: 'password',
        confirmPassword: 'password',
        role: 'admin',
        branch: branch.id
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Admin user created successfully via API!');
      console.log('📧 Email: admin@kanza.com');
      console.log('🔑 Password: password');
      console.log('🏢 Branch: Main Branch');
      console.log('👤 Role: admin');
      console.log('');
      console.log('🚨 IMPORTANT: Please change the password after first login!');
    } else {
      const error = await response.text();
      console.error('❌ Error creating admin user via API:', error);
    }

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUserViaAPI();
