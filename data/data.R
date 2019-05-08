library(tidyverse)
library(sf)
library(magrittr)
library(geojsonio)

setwd(dirname(rstudioapi::getSourceEditorContext()$path))


### LOAD RESULTS, PARCELS, CATCHMENTS ###

load("../../model/final.RData")

parcels2018Jul <- read_sf("https://opendata.arcgis.com/datasets/1b346804e1364a5eb85ccb53302e3c91_0.geojson",
                          stringsAsFactors = FALSE) %>%
  st_transform(4326) %>%
  transmute(SBL     = PRINTKEY,
            address = FullAdd,
            own_name= paste(Owner,Owner2, sep = ", ") %>% gsub(", *$", "", .),
            own_town= Add4,
            own_zip = ZIP,
            nbhd    = Nhood,
            quad    = Quad,
            vland   = AssessedLa,
            value   = AssessedVa,
            acres   = ACRES,
            units   = Units,
            occup   = Occupancy,
            landuse = LandUse)

DOCE_Catchments <- read_sf("../../data/DOCE_Catchments") %>%
  st_transform(4326) %>%
  select(CATCH = OBJECTID)

### GET CATCH IDs, VALUES ###

parcels <- parcels2018Jul %>% 
  left_join(final) %>%
  select(-starts_with("pred")) %>%
  mutate_at(vars(starts_with("prb_")),~.*100) %>%
  
  arrange(desc(prb_HEALTH)) %>%
  mutate(insp_HEALTH = 1:nrow(parcels2018Jul)) %>%
  
  arrange(desc(prb_SAFETY)) %>%
  mutate(insp_SAFETY = 1:nrow(parcels2018Jul)) %>%
  
  arrange(desc(prb_HS)) %>%
  mutate(insp_HS = 1:nrow(parcels2018Jul)) %>%
  
  mutate(insp_HS     = ifelse(!residential,NA,insp_HS),
         insp_HEALTH = ifelse(!residential,NA,insp_HEALTH),
         insp_SAFETY = ifelse(!residential,NA,insp_SAFETY)) %>% 
  
  st_join(DOCE_Catchments,left = T) %>%
  mutate(CATCH = ifelse(is.na(CATCH),22,CATCH))

catchments <- DOCE_Catchments %>%
  left_join(parcels %>% as_tibble %>% select(-geometry)) %>%
  select(CATCH, starts_with("prb")) %>%
  drop_na() %>%
  group_by(CATCH) %>%
  transmute(val_HS = paste0("[", paste(prb_HS,     collapse = ","), "]"),
            val_H  = paste0("[", paste(prb_HEALTH, collapse = ","), "]"),
            val_S  = paste0("[", paste(prb_SAFETY, collapse = ","), "]"),
            avg_HS = mean(prb_HS,     na.rm = T),
            avg_H  = mean(prb_HEALTH, na.rm = T),
            avg_S  = mean(prb_SAFETY, na.rm = T),
            geometry) %>%
  distinct %>% st_sf

### WRITE INTO SEPARATE FILES ###

geojson_write(catchments,
              geometry = "polygon",
              file = "catchments.geojson",
              overwrite = TRUE)

p <- parcels %>%
  split(f = parcels$CATCH)

lapply(seq_along(p),
       function(i) {
         filename <- paste0("catch",i,".geojson")
         geojson_write(p[[i]],
                       geometry = "polygon",
                       file = filename,
                       overwrite = TRUE)
       })

geojson_write(parcels,
              geometry = "polygon",
              file = "parcels.geojson",
              overwrite = TRUE)

