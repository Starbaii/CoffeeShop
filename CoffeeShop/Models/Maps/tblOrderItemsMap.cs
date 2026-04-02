using System;
using System.Collections.Generic;
using System.Data.Entity.ModelConfiguration;
using System.Linq;
using System.Web;

namespace CoffeeShop.Models.Maps
{
    public class tblOrderItemsMap : EntityTypeConfiguration<tblOrderItemsModel>
    {
        public tblOrderItemsMap()
        {
            HasKey(i => i.OrderItemID);
            ToTable("tbl_orderitems");
        }
    }
}