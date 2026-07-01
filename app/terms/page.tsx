import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

export default function TermsOfUse() {
  return (
    <main className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-6 py-32 max-w-4xl">
        <h1 className="font-serif text-4xl md:text-5xl text-foreground mb-8">
          Regulamin korzystania z serwisu
        </h1>
        
        <div className="space-y-8 text-muted-foreground leading-relaxed">
          <section>
            <h2 className="text-xl text-foreground font-semibold mb-4">1. Postanowienia wstępne</h2>
            <p>
              Niniejszy regulamin określa zasady korzystania z funkcjonalności dostępnych na stronie internetowej firmy Crafting Life, w tym zasady przesyłania zapytań poprzez formularz kontaktowy.
            </p>
          </section>

          <section>
            <h2 className="text-xl text-foreground font-semibold mb-4">2. Własność intelektualna</h2>
            <p>
              Wszelkie materiały znajdujące się na stronie (w szczególności projekty architektoniczne, zdjęcia realizacji, grafiki oraz teksty) chronione są prawem autorskim i należą do Crafting Life lub zostały użyte na podstawie odpowiednich licencji. Ich kopiowanie jest zabronione.
            </p>
          </section>

          <section>
            <h2 className="text-xl text-foreground font-semibold mb-4">3. Formularz kontaktowy</h2>
            <p>
              Korzystanie z formularza kontaktowego jest bezpłatne. Użytkownik zobowiązuje się do podawania w nim informacji zgodnych z prawdą i powstrzymania się od wysyłania treści o charakterze bezprawnym (tzw. spam, treści obraźliwe).
            </p>
          </section>

          <section>
            <h2 className="text-xl text-foreground font-semibold mb-4">4. Zmiany Regulaminu</h2>
            <p>
              Administrator zastrzega sobie prawo do wprowadzania zmian w Regulaminie. O każdej zmianie Użytkownicy zostaną poinformowani poprzez publikację nowej treści na tej podstronie.
            </p>
          </section>
        </div>
      </div>
      <Footer />
    </main>
  )
}
