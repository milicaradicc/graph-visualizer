# graph-visualizer

Git repozitorijum voditi po preporučenom GitFlow modelu. Potrebno je da da imate develop granu na kojoj se nalazi kod koji se intenzivno razvija i koji često testiraju svi članovi tima. Kod na ovoj grani mora da radi, a čine ga do datog trenutka implementirane funkcionalnosti koje su dovoljno dobro istestirane.

Razvoj nove funkcionalnosti radi se na posebnoj feature grani. Svaka feature grana odgovara tačno jednom GitHub issue-u. Ove grane predstavljaju alternativne tokove razvoja. Jednu funkcionalnost radi jedan student. Kada se funkcionalnost završi, potrebno je ovu granu spojiti sa develop granom putem merge request-a (pull request-a). Feature grane imenovati u formatu feature-<naziv_grane>.

U slučaju da primetite neki bug, tada pronalazite issue koji odgovara funkcionalnosti, ponovo ga otvarate i kreirate odgovarajući bugfix granu (format imenovanja je bugfix-<naziv_grane>). Na njoj popravljate bug i radite inicijalno testiranje. Kada ste utvrdili da je problem otklonjen, kod spajate sa develop granom putem merge request-a (pull request-a).

Periodično, kod sa develop grane prebacujete na master granu. Master treba da ima stabilnu verziju projekta i merge na master grani će se raditi samo prilikom implementacije milestone-a, odnosno kada završite kontrolnu tačku ili projekat.

Milestone oslikava jedan bitan momenat životnog ciklusa vaše aplikacije. Što se tiče ovog projekta možete da imate 2-3 milestone-a. Rokovi su: I kontrolna tačka, (eventualno II kontrolna tačka) i Predaja projekta (biće naknadno specificirani u dogovoru sa profesorom). Milestone sadrži task-ove (GitLab issues), koji su implementirani tokom tog milestone-a.

Jedan task treba da se odnosi na jednu funkcionalnost aplikacije (engl. feature), koja će biti razvijena na posebnoj feature grani. Task-ove je potrebno napraviti unapred za milestone koji je u toku. Zatim, svaki student uzima task po task (dodeljuje mu se issue), te započinje implementaciju odgovarajuće funkcionalnosti. Kada se implementacija funkcionalnosti završi i uspešno odradi inicijalno testiranje, task se zatvara, a kod prebacuje na develop granu. Nakon toga, ostale kolege treba da urade testiranje svih funkcionalnosti. Ukoliko se ustanovi problem u nekoj od njih, potrebno je ponovo otvoriti odgovarajući task (ne praviti nov).

Sve commit poruke moraju početi sa #jedinstveni-identifikator-issue kako bi se referencirao issue na koga se commit odnosi.

Grane feature i bugfix možete brisati radi preglednosti.
