import { PrismaClient } from '@prisma/client';

const RANKS = [
  {
    id: 'rank-bronze',
    name: 'VIP1',
    displayName: 'Thành viên Đồng',
    description: 'Khách hàng mới',
    minSpending: 0,
    maxSpending: 5000000, // 5 million VND
    color: '#CD7F32',
    benefits: JSON.stringify({
      discount: 0,
      prioritySupport: false,
      description: 'Chào mừng khách hàng mới'
    })
  },
  {
    id: 'rank-silver',
    name: 'VIP2',
    displayName: 'Thành viên Bạc',
    description: 'Khách hàng thân thiết',
    minSpending: 5000000,
    maxSpending: 15000000, // 15 million VND
    color: '#C0C0C0',
    benefits: JSON.stringify({
      discount: 5,
      prioritySupport: false,
      description: 'Giảm giá 5% cho các dịch vụ'
    })
  },
  {
    id: 'rank-gold',
    name: 'VIP3',
    displayName: 'Thành viên Vàng',
    description: 'Khách hàng VIP',
    minSpending: 15000000,
    maxSpending: 30000000, // 30 million VND
    color: '#FFD700',
    benefits: JSON.stringify({
      discount: 10,
      prioritySupport: true,
      description: 'Giảm giá 10%, hỗ trợ ưu tiên'
    })
  },
  {
    id: 'rank-platinum',
    name: 'VIP4',
    displayName: 'Thành viên Bạch Kim',
    description: 'Khách hàng VIP cao cấp',
    minSpending: 30000000,
    maxSpending: 50000000, // 50 million VND
    color: '#E5E4E2',
    benefits: JSON.stringify({
      discount: 15,
      prioritySupport: true,
      lateCheckout: true,
      description: 'Giảm giá 15%, hỗ trợ ưu tiên, trả phòng muộn'
    })
  },
  {
    id: 'rank-diamond',
    name: 'VIP5',
    displayName: 'Thành viên Kim Cương',
    description: 'Khách hàng VIP đặc biệt',
    minSpending: 50000000,
    maxSpending: null, // No upper limit
    color: '#B9F2FF',
    benefits: JSON.stringify({
      discount: 20,
      prioritySupport: true,
      lateCheckout: true,
      roomUpgrade: true,
      description: 'Giảm giá 20%, hỗ trợ ưu tiên, trả phòng muộn, nâng cấp phòng'
    })
  }
];

export async function seedCustomerRanks(prisma: PrismaClient) {
  console.log('  🏆 Seeding customer ranks...');

  for (const rank of RANKS) {
    await prisma.customerRank.upsert({
      where: { id: rank.id },
      create: rank,
      update: rank
    });
  }

  console.log(`    ✓ Created ${RANKS.length} customer ranks`);
}

export default seedCustomerRanks;
