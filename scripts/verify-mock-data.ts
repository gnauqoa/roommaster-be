import axios from 'axios';

const BASE_URL = 'http://localhost:3000/v1';

async function verify() {
  try {
    console.log('1. Authenticating...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@hotel.com',
      password: 'password123'
    });

    if (loginResponse.status === 200) {
      console.log('✅ Login successful');
    } else {
      console.error('❌ Login failed', loginResponse.status);
      return;
    }

    const token = loginResponse.data.tokens.access.token;
    const headers = { Authorization: `Bearer ${token}` };

    console.log('\n2. Getting User Profile...');
    const meResponse = await axios.get(`${BASE_URL}/auth/me`, { headers });
    if (meResponse.status === 200) {
      console.log('✅ Get Profile successful');
      console.log('   User:', meResponse.data.name);
    }

    console.log('\n3. Creating Customer...');
    // Using a random code to avoid unique constraint violations on repeated runs
    const randomCode = `CUST${Math.floor(Math.random() * 10000)}`;
    const randomEmail = `jane.doe.${Math.floor(Math.random() * 10000)}@example.com`;

    try {
      const createCustomerResponse = await axios.post(
        `${BASE_URL}/customers`,
        {
          code: randomCode,
          fullName: 'Jane Doe',
          email: randomEmail,
          phone: '0987654321',
          idNumber: '123456789',
          nationality: 'USA',
          address: '123 Main St, New York',
          customerType: 'INDIVIDUAL'
        },
        { headers }
      );

      if (createCustomerResponse.status === 201) {
        console.log('✅ Create Customer successful');
        console.log('   Customer ID:', createCustomerResponse.data.id);
      }
    } catch (error: any) {
      console.error('❌ Create Customer failed:', error.response?.data || error.message);
    }

    console.log('\n4. Listing Customers...');
    const listCustomersResponse = await axios.get(`${BASE_URL}/customers`, { headers });
    if (listCustomersResponse.status === 200) {
      console.log('✅ List Customers successful');
      console.log('   Count:', listCustomersResponse.data.results.length);
    }

    console.log('\n5. Creating Room Type...');
    const randomRoomTypeCode = `RT${Math.floor(Math.random() * 1000)}`;
    try {
      const createRoomTypeResponse = await axios.post(
        `${BASE_URL}/rooms/types`,
        {
          code: randomRoomTypeCode,
          name: `Deluxe Room ${randomRoomTypeCode}`,
          baseCapacity: 2,
          maxCapacity: 4,
          rackRate: 1500000,
          description: 'A comfortable deluxe room with city view'
        },
        { headers }
      );

      if (createRoomTypeResponse.status === 201) {
        console.log('✅ Create Room Type successful');
        console.log('   Room Type ID:', createRoomTypeResponse.data.id);
      }
    } catch (error: any) {
      console.error('❌ Create Room Type failed:', error.response?.data || error.message);
    }
  } catch (error: any) {
    console.error('❌ Verification failed:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
  }
}

verify();
