<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. MASTER COMPANIES
        Schema::create('master_companies', function (Blueprint $table) {
            $table->id();
            $table->string('company_code', 50)->unique();
            $table->string('company_name');
            $table->string('legal_name')->nullable();
            $table->text('address')->nullable();
            $table->string('phone', 50)->nullable();
            $table->string('email', 100)->nullable();
            $table->string('npwp', 50)->nullable();
            $table->longText('logo_data')->nullable();
            $table->longText('stamp_data')->nullable();
            $table->string('default_signer_name')->nullable();
            $table->string('default_signer_role')->nullable();
            $table->string('bank_name', 100)->nullable();
            $table->string('bank_account_no', 100)->nullable();
            $table->string('bank_account_name', 150)->nullable();
            $table->string('doc_prefix', 20)->default('SPH');
            $table->timestamps();
        });

        // 2. USERS
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->nullable()->constrained('master_companies')->nullOnDelete();
            $table->string('username')->unique();
            $table->string('email')->unique();
            $table->string('password');
            $table->string('full_name');
            $table->enum('role', ['SUPER_ADMIN', 'COMPANY_ADMIN'])->default('COMPANY_ADMIN');
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->rememberToken();
            $table->timestamps();
        });

        // 3. MASTER CUSTOMERS
        Schema::create('master_customers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained('master_companies')->cascadeOnDelete();
            $table->string('code', 50);
            $table->string('company_name');
            $table->string('contact_person')->nullable();
            $table->text('address')->nullable();
            $table->string('phone', 50)->nullable();
            $table->string('email', 100)->nullable();
            $table->string('npwp', 50)->nullable();
            $table->timestamps();
        });

        // 4. MASTER VENDORS
        Schema::create('master_vendors', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained('master_companies')->cascadeOnDelete();
            $table->string('code', 50);
            $table->string('vendor_name');
            $table->string('contact_person')->nullable();
            $table->text('address')->nullable();
            $table->string('phone', 50)->nullable();
            $table->string('email', 100)->nullable();
            $table->string('npwp', 50)->nullable();
            $table->timestamps();
        });

        // 5. QUOTATIONS (SPH Penawaran)
        Schema::create('quotations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained('master_companies')->cascadeOnDelete();
            $table->string('sph_no', 100);
            $table->date('sph_date');
            $table->string('customer_name');
            $table->text('customer_address')->nullable();
            $table->string('project_title')->nullable();
            $table->string('template_type', 50)->default('TEMPLATE_1_HEKSA');
            $table->json('items_data')->nullable(); // RINCIAN DEDIKASI PER BARANG / ITEM PEKERJAAN
            $table->decimal('subtotal', 15, 2)->default(0);
            $table->decimal('dp_amount', 15, 2)->default(0);
            $table->decimal('discount_amount', 15, 2)->default(0);
            $table->decimal('tax_rate_percent', 5, 2)->default(11.00);
            $table->decimal('tax_amount', 15, 2)->default(0);
            $table->decimal('grand_total', 15, 2)->default(0);
            $table->string('status', 50)->default('draft');
            $table->timestamps();
        });

        // 6. PURCHASE ORDERS (PO)
        Schema::create('purchase_orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained('master_companies')->cascadeOnDelete();
            $table->string('po_no', 100);
            $table->date('po_date');
            $table->string('vendor_name');
            $table->json('items_data')->nullable(); // ITEM PO
            $table->decimal('grand_total', 15, 2)->default(0);
            $table->string('status', 50)->default('issued');
            $table->timestamps();
        });

        // 7. DELIVERY ORDERS (DO)
        Schema::create('delivery_orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained('master_companies')->cascadeOnDelete();
            $table->string('do_no', 100);
            $table->date('do_date');
            $table->string('customer_name');
            $table->string('driver_name')->nullable();
            $table->string('vehicle_no', 50)->nullable();
            $table->json('items_data')->nullable(); // ITEM DO / SURAT JALAN
            $table->string('status', 50)->default('delivered');
            $table->timestamps();
        });

        // 8. GOODS RECEIPTS (TTB)
        Schema::create('goods_receipts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained('master_companies')->cascadeOnDelete();
            $table->string('ttb_no', 100);
            $table->date('ttb_date');
            $table->string('received_from');
            $table->string('receiver_name')->nullable();
            $table->json('items_data')->nullable(); // ITEM TTB
            $table->string('status', 50)->default('received');
            $table->timestamps();
        });

        // 9. BAST DOCUMENTS (BAST)
        Schema::create('bast_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained('master_companies')->cascadeOnDelete();
            $table->string('bast_no', 100);
            $table->date('bast_date');
            $table->string('customer_name');
            $table->string('project_title')->nullable();
            $table->string('first_party_name')->nullable();
            $table->string('second_party_name')->nullable();
            $table->json('items_data')->nullable(); // ITEM PEKERJAAN BAST
            $table->string('status', 50)->default('signed');
            $table->timestamps();
        });

        // 10. INVOICES
        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained('master_companies')->cascadeOnDelete();
            $table->string('invoice_no', 100);
            $table->date('invoice_date');
            $table->date('due_date')->nullable();
            $table->foreignId('quotation_id')->nullable()->constrained('quotations')->nullOnDelete();
            $table->string('template_type', 50)->default('TEMPLATE_1_HEKSA');
            $table->string('customer_name');
            $table->json('items_data')->nullable(); // ITEM INVOICE
            $table->decimal('subtotal', 15, 2)->default(0);
            $table->decimal('dp_amount', 15, 2)->default(0);
            $table->decimal('discount_amount', 15, 2)->default(0);
            $table->decimal('tax_rate_percent', 5, 2)->default(11.00);
            $table->decimal('tax_amount', 15, 2)->default(0);
            $table->decimal('grand_total', 15, 2)->default(0);
            $table->string('status', 50)->default('unpaid');
            $table->timestamps();
        });

        // 11. RECEIPTS (Kwitansi)
        Schema::create('receipts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained('master_companies')->cascadeOnDelete();
            $table->string('receipt_no', 100);
            $table->date('receipt_date');
            $table->foreignId('invoice_id')->nullable()->constrained('invoices')->nullOnDelete();
            $table->string('received_from');
            $table->decimal('amount', 15, 2)->default(0);
            $table->string('amount_spelled')->nullable();
            $table->text('payment_for')->nullable();
            $table->string('payment_method', 100)->default('Transfer Bank');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('receipts');
        Schema::dropIfExists('invoices');
        Schema::dropIfExists('bast_documents');
        Schema::dropIfExists('goods_receipts');
        Schema::dropIfExists('delivery_orders');
        Schema::dropIfExists('purchase_orders');
        Schema::dropIfExists('quotations');
        Schema::dropIfExists('master_vendors');
        Schema::dropIfExists('master_customers');
        Schema::dropIfExists('users');
        Schema::dropIfExists('master_companies');
    }
};
