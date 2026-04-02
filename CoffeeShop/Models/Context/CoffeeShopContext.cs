using CoffeeShop.Models.Maps;
using System;
using System.Collections.Generic;
using System.Data.Entity;
using System.Linq;
using System.Web;

namespace CoffeeShop.Models.Context
{
    public class CoffeeShopContext : DbContext
    {
        static CoffeeShopContext()
        {
            Database.SetInitializer<CoffeeShopContext>(null);
        }
        public CoffeeShopContext() : base("Name=molinadb") { }

        public virtual DbSet<tblAdminsModel> tbl_admin { get; set; }
        public virtual DbSet<tblEmployeesModel> tbl_employee { get; set; }
        public virtual DbSet<tblLogsModel> tbl_log { get; set; }
        public virtual DbSet<tblProductsModel> tbl_products { get; set; }
        public virtual DbSet<tblCategoryModel> tbl_category { get; set; }
        public virtual DbSet<tblStockModel> tbl_restock { get; set; }
        public virtual DbSet<tblAddonModel> tbl_addon { get; set; }

        public virtual DbSet<tblOrderItemsModel> tbl_orderitems { get; set; }
        public virtual DbSet<tblOrdersModel> tbl_orders{ get; set; }
        public virtual DbSet<tblTransactionsModel> tbl_transaction{ get; set; }


        protected override void OnModelCreating(DbModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            modelBuilder.Configurations.Add(new tblLogsMap());
            modelBuilder.Configurations.Add(new tblEmployeesMap());
            modelBuilder.Configurations.Add(new tblAdminsMap());
            modelBuilder.Configurations.Add(new tblOrderItemsMap());
            modelBuilder.Configurations.Add(new tblOrdersMap());
            modelBuilder.Configurations.Add(new tblProductsMap()); 
            modelBuilder.Configurations.Add(new tblCategoryMap());
            modelBuilder.Configurations.Add(new tblStockMap());
            modelBuilder.Configurations.Add(new tblAddonMap());
            modelBuilder.Configurations.Add(new tblTransactionsMap());



        }
    }
    }
