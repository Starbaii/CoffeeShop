using System;
using System.Collections.Generic;
using System.Data.Entity.ModelConfiguration;
using System.Linq;
using System.Web;

namespace CoffeeShop.Models.Maps
{
    public class tblStockMap : EntityTypeConfiguration<tblStockModel>
    {
        public tblStockMap()
        {
            HasKey(i => i.RestockID);
            ToTable("tbl_restock");
        }
    }

}