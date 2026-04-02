
using System;
using System.Collections.Generic;
using System.Data.Entity.ModelConfiguration;
using System.Linq;
using System.Web;

namespace CoffeeShop.Models.Maps
{
    public class tblProductsMap : EntityTypeConfiguration<tblProductsModel>
    {
        public tblProductsMap()
        {
            HasKey(i => i.ProductID);
            ToTable("tbl_products");
        }
    }
}