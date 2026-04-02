using System;
using System.Collections.Generic;
using System.Data.Entity.ModelConfiguration;
using System.Linq;
using System.Web;

namespace CoffeeShop.Models.Maps
{
    public class tblAddonMap : EntityTypeConfiguration<tblAddonModel>
    {
        public tblAddonMap()
        {
            HasKey(i => i.addonID);
            ToTable("tbl_addon");
        }
    }
}