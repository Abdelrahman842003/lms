use App\Models\Secretary;
use App\Models\Academy;
use Illuminate\Support\Facades\Hash;

// Delete old test data if exists
Secretary::where('phone', '01099999999')->delete();
Academy::where('phone', '01099999999')->delete();

// Create secretary
$secretary = Secretary::create([
    'name' => 'سكرتير أكاديمية الاختبار',
    'phone' => '01099999999',
    'password' => Hash::make('password'),
    'is_active' => true,
]);

// Create academy
$academy = Academy::create([
    'name' => 'أكاديمية الاختبار',
    'phone' => '01099999999',
    'email' => 'test@academy.com',
    'is_active' => true,
]);

// Attach secretary to academy
$academy->secretaries()->attach($secretary->id, [
    'permissions' => ['manage_teachers', 'view_reports', 'view_billing'],
    'is_active' => true,
]);

echo "✅ Account Created!\n";
echo "📱 Phone: 01099999999\n";
echo "🔑 Password: password\n";
echo "🏢 Academy: {$academy->name}\n";
echo "👤 Secretary: {$secretary->name}\n";
echo "✅ Secretary Active: " . ($secretary->is_active ? 'Yes' : 'No') . "\n";
echo "✅ Pivot Active: " . ($academy->secretaries()->first()->pivot->is_active ? 'Yes' : 'No') . "\n";
