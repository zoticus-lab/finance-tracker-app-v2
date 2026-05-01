import * as Icons from 'lucide-react';

const iconNames = [
  'DollarSign', 'Gift', 'TrendingUp', 'Send', 
  'Utensils', 'Car', 'ShoppingBag', 'FileText', 
  'Heart', 'Smile', 'CheckCircle', 'MapPin',
  'Settings', 'Zap', 'RotateCw', 'AlertCircle', 
  'MoreHorizontal', 'ArrowRightLeft', 'AlertTriangle', 'CreditCard'
];

console.log('🔍 Testing Lucide React Icons\n');

const notFound = [];
iconNames.forEach(name => {
  const component = Icons[name];
  if (component) {
    console.log(`✓ ${name.padEnd(20)} EXISTS`);
  } else {
    console.log(`✗ ${name.padEnd(20)} NOT FOUND`);
    notFound.push(name);
  }
});

console.log('\n' + '='.repeat(50));
if (notFound.length === 0) {
  console.log('✅ All icons exist!');
} else {
  console.log(`❌ ${notFound.length} icons missing: ${notFound.join(', ')}`);
}

// Show sample of available icons
console.log('\n📋 Sample available icons:');
const sampleIcons = Object.keys(Icons).filter(k => typeof Icons[k] === 'function').slice(0, 30);
console.log(sampleIcons.join(', '));
