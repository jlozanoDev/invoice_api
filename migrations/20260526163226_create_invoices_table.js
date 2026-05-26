/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('invoices', (table) => {
    table.string('id', 36).primary();
    table.string('number', 20).nullable();
    table.enu('status', ['borrador', 'definitivo']).notNullable().defaultTo('borrador');
    table.string('issuer_name', 255).notNullable();
    table.string('issuer_nif', 20).notNullable();
    table.text('issuer_address').notNullable();
    table.string('client_name', 255).notNullable();
    table.string('client_cif', 20).notNullable();
    table.text('client_address').notNullable();
    table.date('issue_date').notNullable();
    table.date('operation_date').notNullable();
    table.text('description').notNullable();
    table.decimal('base_amount', 12, 2).notNullable();
    table.decimal('vat_rate', 5, 2).notNullable();
    table.decimal('vat_amount', 12, 2).notNullable();
    table.decimal('total_amount', 12, 2).notNullable();
    table.datetime('created_at').notNullable();
    table.datetime('updated_at').notNullable();

    table.index('status');
    table.index('client_cif');
    table.index('issue_date');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('invoices');
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  
};
