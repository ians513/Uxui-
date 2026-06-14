const dns = require('dns').promises;

// Force IPv4
dns.setDefaultResultOrder('ipv4first');

async function testDNS() {
  try {
    console.log('🔍 Resolviendo: db.zeegjyifgfuybcvfnwzp.supabase.co');
    const address = await dns.resolve4('db.zeegjyifgfuybcvfnwzp.supabase.co');
    console.log('✅ IPv4 Address:', address);
  } catch (err) {
    console.error('❌ IPv4 Error:', err.message);
  }

  try {
    console.log('\n🔍 Resolviendo IPv6: db.zeegjyifgfuybcvfnwzp.supabase.co');
    const address = await dns.resolve6('db.zeegjyifgfuybcvfnwzp.supabase.co');
    console.log('✅ IPv6 Address:', address);
  } catch (err) {
    console.error('❌ IPv6 Error:', err.message);
  }

  try {
    console.log('\n🔍 Resolviendo (generic): db.zeegjyifgfuybcvfnwzp.supabase.co');
    const address = await dns.lookup('db.zeegjyifgfuybcvfnwzp.supabase.co', { family: 4 });
    console.log('✅ Generic IPv4:', address);
  } catch (err) {
    console.error('❌ Generic Error:', err.message);
  }
}

testDNS();
