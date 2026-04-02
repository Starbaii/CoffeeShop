using System;
using System.Collections.Generic;
using System.Data.Entity.ModelConfiguration;
using System.Linq;
using System.Web;

namespace CoffeeShop.Models.Maps
{
    public class tblOrdersMap : EntityTypeConfiguration<tblOrdersModel>
    {
        public tblOrdersMap()
        {
            HasKey(i => i.OrderID);
            ToTable("tbl_orders");
        }
    }
}