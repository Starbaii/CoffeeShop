
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace CoffeeShop.Models
{
    public class addonInformation
    {
        public int AddonID { get; set; }
        public int ProductID { get; set; }
        public string addonName { get; set; }
        public float addonPrice { get; set; }
        public DateTime Datecreated { get; set; }
        public DateTime Dateupdated { get; set; }
    }
}