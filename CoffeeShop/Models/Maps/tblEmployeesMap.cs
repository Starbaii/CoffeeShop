using System;
using System.Collections.Generic;
using System.Data.Entity.ModelConfiguration;
using System.Linq;
using System.Web;

namespace CoffeeShop.Models.Maps
{
    public class tblEmployeesMap : EntityTypeConfiguration<tblEmployeesModel>
    {
        public tblEmployeesMap ()
        {
            HasKey(i => i.EmployeeID);
            ToTable("tbl_employee");
        }
    }
}