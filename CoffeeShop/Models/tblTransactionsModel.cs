using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.UI.WebControls.WebParts;
using System.ComponentModel.DataAnnotations;       
using System.ComponentModel.DataAnnotations.Schema;

namespace CoffeeShop.Models
{
    public class tblTransactionsModel
    {
        public int TransactionID { get; set; }
        public int EmployeeID { get; set; }
        public int OrderID { get; set; }
        public int ProductID { get; set; }
        public int Quantitysold { get; set; }
        public string Transactiontype { get; set; }
        public string GCashRef { get; set; }
        public float AmountPaid { get; set; }
        public float AmountChange { get; set; }
        public DateTime Datecreated { get; set; }   
        public DateTime Dateupdated { get; set; }   
    }
}