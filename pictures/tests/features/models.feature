Feature: Rertrieve pictures

    Scenario: Get pictures
        Clear all pictures
        And Add three pictures to the database with different dates
        When I Get last pictures
        I have three pictures ordered by date
        When I get first from its id
        I have one picture corresponding to id

