using System;
using System.Collections.Generic;
using System.Data.Entity.ModelConfiguration;
using System.Linq;
using System.Web;

namespace CoffeeShop.Models.Maps
{
    public class tblTransactionsMap : EntityTypeConfiguration<tblTransactionsModel>
    {
        public tblTransactionsMap()
        {
            HasKey(i => i.TransactionID);
            ToTable("tbl_transaction");
        }
    }

}