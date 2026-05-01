// Verify Lucide React icons exist
import * as Icons from 'lucide-react';

const iconNames = [
  'DollarSign', 'Gift', 'TrendingUp', 'Send', 'Utensils', 'Car', 
  'ShoppingBag', 'FileText', 'Heart', 'Smile', 'UserCheck', 'ParkingCircle',
  'Settings', 'Fuel', 'RotateCw', 'AlertCircle', 'MoreHorizontal',
  'ArrowRightLeft', 'AlertTriangle', 'CreditCard'
];

console.log('✅ Checking Lucide React icons...\n');

iconNames.forEach(name => {
  const IconComponent = Icons[name];
  if (IconComponent) {
    console.log(`✓ ${name}`);
  } else {
    console.log(`✗ ${name} - NOT FOUND`);
  }
});

console.log('\n📋 All available icons in lucide-react:');
console.log(Object.keys(Icons).filter(k => k[0] === k[0].toUpperCase()).slice(0, 20).join(', '));
