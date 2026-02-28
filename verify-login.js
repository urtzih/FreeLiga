#!/usr/bin/env node

const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

(async () => {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'rootpassword',
    database: 'railway'
  });

  try {
    const [users] = await conn.query('SELECT id, email, password, isActive FROM users WHERE email = ?', ['urtzid@gmail.com']);
    
    if (users.length === 0) {
      console.log('\n❌ Usuario urtzid@gmail.com NO EXISTE en BD\n');
      console.log('Usuarios disponibles:');
      const [allUsers] = await conn.query('SELECT email FROM users LIMIT 5');
      allUsers.forEach(u => console.log('  • ' + u.email));
    } else {
      const user = users[0];
      const match = await bcrypt.compare('123456', user.password);
      console.log('\nUsuario encontrado: ' + user.email);
      console.log('Status: ' + (user.isActive ? 'ACTIVO' : 'INACTIVO'));
      console.log('Password 123456: ' + (match ? 'CORRECTA' : 'INCORRECTA'));
      
      if (match && user.isActive) {
        console.log('\n✓ Las credenciales son VALIDAS - el problema esta en otra parte');
      }
    }
  } finally {
    await conn.end();
  }
})();
