using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace CoffeeShop.Models
{
    public class tblCategoryModel
    {
        public int CategoryID { get; set; }
        public string Categoryname { get; set; }
        public int ProductID { get; set; }
        public DateTime Datecreated { get; set; }
        public DateTime Dateupdated { get; set; }
    }
}
