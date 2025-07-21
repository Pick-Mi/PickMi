import { OwlOptions } from 'ngx-owl-carousel-o';

export const catalogs_owloptions: OwlOptions = {
    loop:true,
    dots:true,
    lazyLoad:true,
    autoplay:true,
    margin:15,
    navText : ["<i class='fa-solid fa-caret-left'></i>","<i class='fa-solid fa-caret-right'></i>"],
    responsive:{
        0:{
            items:1,
            dots:true,
            nav:false
        },
        768:{
            items:2,
            dots:true,
            nav:false
        },
        1199:{
            items:2,
            nav:false,
            dots:true,
            loop:true
        },
        1920:{
            items:3,
            nav:false,
            dots:true,
            loop:true
        }
    }
}