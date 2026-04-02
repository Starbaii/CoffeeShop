using System;
using System.Collections.Generic;
using System.Data.Entity.ModelConfiguration;
using System.Linq;
using System.Web;

namespace CoffeeShop.Models.Maps
{
    public class tblAdminsMap : EntityTypeConfiguration<tblAdminsModel>
    {
        public tblAdminsMap()
        {
            HasKey(i => i.AdminID);
            ToTable("tbl_admin");
        }
    }
}