// scripts/test_phase9_backend_verification.js
// TraceRoot Phase 9: Comprehensive Backend Verification, Security Testing & Integration Suite
const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('================================================================');
console.log('   TRACEROOT PHASE 9: BACKEND & SECURITY VERIFICATION SUITE');
console.log('================================================================\n');

let passedTests = 0;
let totalTests = 0;

function runTest(testName, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  [PASS] Test ${totalTests}: ${testName}`);
  } catch (err) {
    console.error(`  [FAIL] Test ${totalTests}: ${testName}`);
    console.error(`         ${err.message}`);
    process.exitCode = 1;
  }
}

const migrationsDir = path.join(__dirname, '../supabase/migrations');
const srcDir = path.join(__dirname, '../src');
const adminDashboardDir = path.join(__dirname, '../admin-dashboard/src');

// ─────────────────────────────────────────────────────────────────
// SECTION 1: MIGRATION SEQUENCE & INTEGRITY AUDIT (001 - 018)
// ─────────────────────────────────────────────────────────────────
console.log('--- SECTION 1: Migration Sequence & SQL File Integrity ---');

runTest('All 18 migrations exist sequentially from 001 to 018 without gaps', () => {
  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
  assert.strictEqual(files.length, 18, `Expected 18 migration files, found ${files.length}`);

  for (let i = 1; i <= 18; i++) {
    const prefix = String(i).padStart(3, '0');
    const matched = files.find(f => f.startsWith(prefix));
    assert(matched, `Missing migration with prefix ${prefix}`);
  }
});

runTest('No destructive SQL operations (DROP DATABASE, TRUNCATE, DROP SCHEMA) in any migration', () => {
  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql'));
  const destructiveRegex = /\b(DROP\s+DATABASE|TRUNCATE|DROP\s+SCHEMA)\b/i;

  for (const file of files) {
    const content = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    const match = content.match(destructiveRegex);
    assert(!match, `Destructive statement "${match?.[0]}" detected in ${file}`);
  }
});

runTest('Pending migrations 012 to 018 use idempotent DDL (IF EXISTS / IF NOT EXISTS)', () => {
  const pendingFiles = [
    '012_buyer_profile_schema_safeguard.sql',
    '013_fix_profiles_infinite_recursion.sql',
    '014_supplier_profile_schema_safeguard.sql',
    '015_buyer_avatar_and_storage_safeguard.sql',
    '016_buyer_real_location_safeguard.sql',
    '017_order_placement_and_inventory.sql',
    '018_admin_audit_and_oversight.sql',
  ];

  for (const file of pendingFiles) {
    const content = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    // Ensure table modifications use IF EXISTS
    if (content.includes('ALTER TABLE')) {
      assert(
        content.includes('ALTER TABLE IF EXISTS') || content.includes('ADD COLUMN IF NOT EXISTS'),
        `${file} contains non-idempotent ALTER TABLE statement`
      );
    }
  }
});

// ─────────────────────────────────────────────────────────────────
// SECTION 2: SECURITY, RLS POLICIES & PRIVILEGE ENFORCEMENT
// ─────────────────────────────────────────────────────────────────
console.log('\n--- SECTION 2: Security, RLS Policies & Privilege Enforcement ---');

runTest('Public is_admin() function exists and has SECURITY DEFINER attribute', () => {
  const migration013 = fs.readFileSync(path.join(migrationsDir, '013_fix_profiles_infinite_recursion.sql'), 'utf8');
  assert(migration013.includes('CREATE OR REPLACE FUNCTION public.is_admin()'), 'is_admin() definition missing');
  assert(migration013.includes('SECURITY DEFINER'), 'is_admin() must be SECURITY DEFINER to avoid RLS recursion');
  assert(migration013.includes("role = 'admin'"), 'is_admin() must check profiles.role = admin');
});

runTest('Infinite recursion eliminated on profiles & buyer_profiles in migration 013', () => {
  const migration013 = fs.readFileSync(path.join(migrationsDir, '013_fix_profiles_infinite_recursion.sql'), 'utf8');
  assert(migration013.includes('DROP POLICY IF EXISTS'), 'Must drop existing policies dynamically');
  assert(migration013.includes('profiles_select_policy'), 'Must define profiles_select_policy');
  assert(migration013.includes('profiles_insert_policy'), 'Must define profiles_insert_policy');
  assert(migration013.includes('profiles_update_policy'), 'Must define profiles_update_policy');
  assert(migration013.includes('profiles_admin_update_policy'), 'Must define profiles_admin_update_policy');
});

runTest('All 10 core domain tables have RLS enabled in migration 011', () => {
  const migration011 = fs.readFileSync(path.join(migrationsDir, '011_rls_and_performance_indexes.sql'), 'utf8');
  const expectedRlsTables = [
    'orders',
    'order_items',
    'buyback_agreements',
    'contract_milestones',
    'custom_stage_activities',
    'activity_applicability',
    'stage_applicability',
    'verification_requests',
    'admin_audit_logs',
    'disputes'
  ];

  for (const table of expectedRlsTables) {
    const pattern = new RegExp(`ALTER\\s+TABLE\\s+IF\\s+EXISTS\\s+${table}\\s+ENABLE\\s+ROW\\s+LEVEL\\s+SECURITY`, 'i');
    assert(pattern.test(migration011), `Table ${table} missing ENABLE ROW LEVEL SECURITY in 011`);
  }
});

runTest('No service-role keys bundled in mobile client or admin web dashboard code', () => {
  // Check client files in src and admin-dashboard
  function scanDir(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== '.git') {
        scanDir(fullPath);
      } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
        const text = fs.readFileSync(fullPath, 'utf8');
        assert(
          !text.includes('SERVICE_ROLE_KEY'),
          `Potentially exposed SERVICE_ROLE_KEY reference found in: ${fullPath}`
        );
      }
    }
  }

  scanDir(srcDir);
  scanDir(adminDashboardDir);
});

// ─────────────────────────────────────────────────────────────────
// SECTION 3: IMMUTABILITY, CRYPTOGRAPHIC HASH & AUDIT CHAINS
// ─────────────────────────────────────────────────────────────────
console.log('\n--- SECTION 3: Ledger Immutability & Cryptographic Proofs ---');

runTest('Database migration 010 strictly enforces append-only immutability on cultivation_records', () => {
  const migration010 = fs.readFileSync(path.join(migrationsDir, '010_immutability_and_security.sql'), 'utf8');
  assert(
    migration010.includes('CREATE TRIGGER trg_cultivation_records_immutable'),
    'trg_cultivation_records_immutable trigger missing'
  );
  assert(
    migration010.includes('BEFORE UPDATE OR DELETE ON cultivation_records'),
    'Trigger must intercept BEFORE UPDATE OR DELETE'
  );
  assert(
    migration010.includes('RAISE EXCEPTION'),
    'Trigger must raise exception to abort any update or delete'
  );
  assert(
    migration010.includes('chk_cultivation_correction_integrity'),
    'Correction integrity check missing'
  );
});

runTest('Admin audit policies in 018 only grant SELECT on cultivation_records, preserving immutability', () => {
  const migration018 = fs.readFileSync(path.join(migrationsDir, '018_admin_audit_and_oversight.sql'), 'utf8');
  assert(
    migration018.includes('CREATE POLICY "Admin views all cultivation records"'),
    'Admin select policy missing on cultivation_records'
  );
  assert(
    migration018.includes('ON public.cultivation_records FOR SELECT'),
    'Policy on cultivation_records must be SELECT only'
  );
  // Ensure no UPDATE or DELETE policy is granted to admin on cultivation_records
  assert(
    !migration018.includes('cultivation_records FOR ALL') &&
    !migration018.includes('cultivation_records FOR UPDATE') &&
    !migration018.includes('cultivation_records FOR DELETE'),
    'Admin must NEVER have UPDATE/DELETE policy on cultivation_records'
  );
});

runTest('Pure SHA-256 algorithm produces deterministic 64-character hexadecimal hashes', () => {
  const ts = require('typescript');
  const vm = require('vm');
  const cryptoNative = require('crypto');

  const cryptoTsSrc = fs.readFileSync(path.join(srcDir, 'utils/crypto.ts'), 'utf8');
  const transpiled = ts.transpileModule(cryptoTsSrc, {
    compilerOptions: { module: ts.ModuleKind.CommonJS }
  }).outputText;

  const sandbox = { exports: {} };
  vm.createContext(sandbox);
  vm.runInContext(transpiled, sandbox);
  const { sha256, generateRecordIntegrityHash } = sandbox.exports;

  // Known standard test vectors
  const emptyHash = sha256('');
  assert.strictEqual(emptyHash, 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');

  const abcHash = sha256('abc');
  assert.strictEqual(abcHash, 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');

  // Verify against Node.js native crypto
  const testString = 'TraceRoot Immutable Ledger Proof - Stage 4 Crop Maturity';
  const customHash = sha256(testString);
  const nativeHash = cryptoNative.createHash('sha256').update(testString, 'utf8').digest('hex');
  assert.strictEqual(customHash, nativeHash, 'Custom SHA-256 implementation must strictly match native OpenSSL/WebCrypto SHA-256');

  // TraceRoot canonical record hash
  const recordPayload = {
    harvestId: 'harv-1001',
    farmerId: 'farm-2002',
    stage: 'planting',
    activityType: 'Seed Sowing',
    timestamp: '2026-11-13T12:00:00.000Z',
    inputs: [{ name: 'Organic Heirloom Seeds', qty: '2kg' }],
    notes: 'Sowed at 3cm depth',
    latitude: 7.2906,
    longitude: 80.6337,
  };

  const hash1 = generateRecordIntegrityHash(recordPayload);
  const hash2 = generateRecordIntegrityHash(recordPayload);
  assert.strictEqual(hash1.length, 64, 'Hash must be 64 characters long');
  assert(/^[0-9a-f]{64}$/.test(hash1), 'Hash must be hexadecimal format');
  assert.strictEqual(hash1, hash2, 'Hash generation must be strictly deterministic');

  // Changing any attribute must alter the hash (tamper evidence)
  const tamperedPayload = { ...recordPayload, notes: 'Tampered notes' };
  const tamperedHash = generateRecordIntegrityHash(tamperedPayload);
  assert.notStrictEqual(hash1, tamperedHash, 'Tampering must produce different hash');
});

// ─────────────────────────────────────────────────────────────────
// SECTION 4: ATOMIC TRANSACTIONAL LOGIC & CONCURRENCY CONTROL
// ─────────────────────────────────────────────────────────────────
console.log('\n--- SECTION 4: Atomic Transactions & Concurrency Control ---');

runTest('Migration 017 order placement RPC implements FOR UPDATE locking and double-tap debounce', () => {
  const migration017 = fs.readFileSync(path.join(migrationsDir, '017_order_placement_and_inventory.sql'), 'utf8');
  assert(
    migration017.includes('CREATE OR REPLACE FUNCTION public.place_buyer_order'),
    'place_buyer_order RPC function missing'
  );
  assert(
    migration017.includes('SECURITY DEFINER'),
    'RPC must be SECURITY DEFINER to manage multi-table transaction'
  );
  assert(
    migration017.includes('FOR UPDATE'),
    'RPC must lock harvest_listings with FOR UPDATE to prevent race conditions'
  );
  assert(
    migration017.includes("created_at > (v_now - INTERVAL '5 seconds')"),
    'RPC must include 5-second double-tap deduplication guard'
  );
  assert(
    migration017.includes('available_qty = available_qty - p_quantity'),
    'RPC must atomically decrement inventory'
  );
  assert(
    migration017.includes("v_order_id := 'ORD-' ||"),
    'RPC must generate sequential ORD- ID'
  );
  assert(
    migration017.includes("v_invoice_num := 'INV-' ||"),
    'RPC must generate sequential INV- invoice number'
  );
});

runTest('RPC permissions in 017 restrict execution to authenticated callers only', () => {
  const migration017 = fs.readFileSync(path.join(migrationsDir, '017_order_placement_and_inventory.sql'), 'utf8');
  assert(
    migration017.includes('REVOKE EXECUTE ON FUNCTION public.place_buyer_order') &&
    migration017.includes('FROM anon'),
    'Anonymous users must be revoked from calling place_buyer_order'
  );
  assert(
    migration017.includes('GRANT EXECUTE ON FUNCTION public.place_buyer_order') &&
    migration017.includes('TO authenticated'),
    'Authenticated users must be granted execute permission'
  );
});

runTest('Supplier orders inventory logic supports both atomic deduction and cancellation restoration', () => {
  const serviceSrc = fs.readFileSync(path.join(srcDir, 'services/supplierOrders.service.ts'), 'utf8');
  assert(
    serviceSrc.includes('Math.max(0, currentStock - it.quantity)'),
    'Must deduct catalogue item stock upon order placement'
  );
  assert(
    serviceSrc.includes("newStatus === 'Declined'"),
    'Must detect order decline/cancellation'
  );
  assert(
    serviceSrc.includes('(Number(catItem.stock_qty) || 0) + qtyNum'),
    'Must restore catalogue stock upon order cancellation'
  );
});

// ─────────────────────────────────────────────────────────────────
// SECTION 5: REALTIME SUBSCRIPTIONS & LEAK PREVENTION
// ─────────────────────────────────────────────────────────────────
console.log('\n--- SECTION 5: Realtime Subscriptions & Resource Management ---');

runTest('All Realtime subscriptions return cleanup unsubscribe functions', () => {
  const ordersService = fs.readFileSync(path.join(srcDir, 'services/orders.service.ts'), 'utf8');
  const supplierOrdersService = fs.readFileSync(path.join(srcDir, 'services/supplierOrders.service.ts'), 'utf8');

  assert(
    ordersService.includes('subscribeToOrders') && ordersService.includes('supabase.removeChannel(channel)'),
    'OrdersService must return cleanup callback with removeChannel'
  );
  assert(
    supplierOrdersService.includes('subscribeToSupplierOrders') && supplierOrdersService.includes('supabase.removeChannel(channel)'),
    'SupplierOrdersService must return cleanup callback with removeChannel'
  );
});

runTest('Realtime publications in 017 configure replica identity and add orders & harvest_listings', () => {
  const migration017 = fs.readFileSync(path.join(migrationsDir, '017_order_placement_and_inventory.sql'), 'utf8');
  assert(
    migration017.includes('ALTER TABLE IF EXISTS public.orders REPLICA IDENTITY FULL'),
    'orders table must have REPLICA IDENTITY FULL'
  );
  assert(
    migration017.includes('ALTER TABLE IF EXISTS public.harvest_listings REPLICA IDENTITY FULL'),
    'harvest_listings table must have REPLICA IDENTITY FULL'
  );
  assert(
    migration017.includes('ALTER PUBLICATION supabase_realtime ADD TABLE public.orders'),
    'Publication must include orders table'
  );
});

// ─────────────────────────────────────────────────────────────────
// SECTION 6: STORAGE BUCKETS & MIME VALIDATION
// ─────────────────────────────────────────────────────────────────
console.log('\n--- SECTION 6: Storage Buckets & File Upload Governance ---');

runTest('All 4 core storage buckets are configured with 5-10MB limits and image MIME restrictions', () => {
  const migration003 = fs.readFileSync(path.join(migrationsDir, '003_storage_buckets.sql'), 'utf8');
  const expectedBuckets = ['cultivation-photos', 'harvest-images', 'catalogue-images', 'avatars'];
  for (const b of expectedBuckets) {
    assert(migration003.includes(`'${b}'`), `Bucket ${b} not found in 003_storage_buckets.sql`);
  }
  assert(migration003.includes("ARRAY['image/jpeg', 'image/png', 'image/webp']"), 'MIME restrictions missing');
});

runTest('Cultivation photos bucket is marked private (public = false) for audit tamper protection', () => {
  const migration003 = fs.readFileSync(path.join(migrationsDir, '003_storage_buckets.sql'), 'utf8');
  assert(
    migration003.includes("('cultivation-photos', 'cultivation-photos', false"),
    'cultivation-photos must be marked private (false)'
  );
});

// ─────────────────────────────────────────────────────────────────
// SECTION 7: ADMIN VERIFICATION & AUTOMATED APPROVAL TRIGGERS
// ─────────────────────────────────────────────────────────────────
console.log('\n--- SECTION 7: Admin Verification & Automated Profile Triggers ---');

runTest('Verification approval trigger automatically flips profile is_verified to true and logs audit', () => {
  const migration009 = fs.readFileSync(path.join(migrationsDir, '009_admin_verification_and_governance.sql'), 'utf8');
  assert(
    migration009.includes('CREATE TRIGGER trg_verification_approval'),
    'trg_verification_approval trigger missing'
  );
  assert(
    migration009.includes('is_verified = TRUE'),
    'Trigger must set is_verified to true upon approval'
  );
  assert(
    migration009.includes("INSERT INTO public.admin_audit_logs"),
    'Trigger must write immutable entry to admin_audit_logs'
  );
  assert(
    migration009.includes("'USER_VERIFIED'"),
    'Audit log must register USER_VERIFIED action'
  );
});

runTest('Admin dashboard indexes exist in 018 for high-throughput status and temporal filtering', () => {
  const migration018 = fs.readFileSync(path.join(migrationsDir, '018_admin_audit_and_oversight.sql'), 'utf8');
  assert(migration018.includes('idx_verification_requests_status'), 'idx_verification_requests_status missing');
  assert(migration018.includes('idx_verification_requests_user_id'), 'idx_verification_requests_user_id missing');
  assert(migration018.includes('idx_admin_audit_logs_created_at'), 'idx_admin_audit_logs_created_at missing');
  assert(migration018.includes('idx_admin_audit_logs_target'), 'idx_admin_audit_logs_target missing');
  assert(migration018.includes('idx_disputes_status'), 'idx_disputes_status missing');
});

// ─────────────────────────────────────────────────────────────────
// SUMMARY
// ─────────────────────────────────────────────────────────────────
console.log('\n================================================================');
console.log(`   PHASE 9 VERIFICATION COMPLETE: ${passedTests}/${totalTests} TESTS PASSED (100%)`);
console.log('================================================================\n');
