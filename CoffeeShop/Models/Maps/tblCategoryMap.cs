using System;
using System.Collections.Generic;
using System.Data.Entity.ModelConfiguration;
using System.Linq;
using System.Web;

namespace CoffeeShop.Models.Maps
{
    public class tblCategoryMap : EntityTypeConfiguration<tblCategoryModel>
    {
        public tblCategoryMap()
        {
            HasKey(i => i.CategoryID);
            ToTable("tbl_category");
        }
    }
}