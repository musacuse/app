library(tidyverse)
library(sf)
library(magrittr)
library(geojsonio)

setwd(dirname(rstudioapi::getSourceEditorContext()$path))

#parcels2018Jul <- read_sf("https://opendata.arcgis.com/datasets/1b346804e1364a5eb85ccb53302e3c91_0.geojson",
#                          stringsAsFactors = FALSE)
parcels2018Jul <- read_sf("parcels.geojson",
                          stringsAsFactors = FALSE) %>%
  select(SBL = PRINTKEY, geometry)

catchment <- read_sf("catchments.geojson") %>%
  select(CATCH = OBJECTID)

bbox <- st_bbox(catchment) %>% as.numeric

parcels <- c(1:nrow(catchment)) %>% 
  lapply(function(i) {
    
  c <- catchment[i,]

  bb <- c %>% 
    st_bbox %>% 
    as.matrix %>% t %>% 
    as_tibble %>%
    mutate(xmin = xmin - 0.005,
           ymin = ymin - 0.005,
           xmax = xmax + 0.005,
           ymax = ymax + 0.005)
  
  bounds <- rbind(
    c(bb$xmin,bb$ymin),
    c(bb$xmax,bb$ymin),
    c(bb$xmax,bb$ymax),
    c(bb$xmin,bb$ymax),
    c(bb$xmin,bb$ymin)
  ) %>% list %>% 
    st_polygon %>%
    st_sfc %>% st_sf %>%
    st_set_crs(4326) %>%
    mutate(CATCH = c$CATCH)
  
  out <- parcels2018Jul %>%
    st_join(bounds,
            left = FALSE)
  
  return(out)
  
})

lapply(seq_along(parcels),function(i) {
  filename <- paste0("catch",i)
  geojson_write(parcels[[i]],
                geometry = "polygon",
                file = filename)
})
